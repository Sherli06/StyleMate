const fs = require('fs');
const path = require('path');
const config = require('../config');

// Workaround for SSL interception in local dev
const originalTLS = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

/**
 * Ensures an image is accessible to an external service like FASHN.
 * If the image is a public URL, it returns it as-is.
 * If it's a data URI, it returns it as-is.
 * If it's a local/relative path, localhost URL, or points to local uploads,
 * it reads the file and returns a base64 Data URI so the external API can access it.
 */
function toAccessibleImage(imageUriOrPath) {
  if (!imageUriOrPath || typeof imageUriOrPath !== 'string') {
    throw new Error('Image parameter is missing or invalid.');
  }

  const trimmed = imageUriOrPath.trim();

  // Already a base64 data URI
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Check if it's a localhost / 127.0.0.1 URL or relative /uploads path
  const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(trimmed);
  const isUploadsPath = trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/');

  if (isLocalhostUrl || isUploadsPath) {
    let filename;
    if (isLocalhostUrl) {
      try {
        const parsed = new URL(trimmed);
        filename = path.basename(parsed.pathname);
      } catch {
        filename = path.basename(trimmed);
      }
    } else {
      filename = path.basename(trimmed);
    }

    const localFilePath = path.join(config.upload.dir, filename);
    if (fs.existsSync(localFilePath)) {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      const mimeType = mimeTypes[ext] || 'image/jpeg';
      const fileBuffer = fs.readFileSync(localFilePath);
      return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    }
  }

  // If it's a public HTTP/HTTPS URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Check if it's an absolute or relative path to a local file
  if (fs.existsSync(trimmed)) {
    const ext = path.extname(trimmed).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    const fileBuffer = fs.readFileSync(trimmed);
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  return trimmed;
}

async function callFashn(endpoint, options = {}) {
  const apiKey = config.fashn.apiKey;
  if (!apiKey) throw Object.assign(new Error('FASHN_API_KEY is not configured. Virtual try-on requires a valid FASHN API key.'), { status: 503 });

  // Temporarily disable TLS verification for local dev SSL interception
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  try {
    const res = await fetch(`${config.fashn.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      let msg = `FASHN API error (${res.status})`;
      try {
        const parsed = JSON.parse(body);
        msg = parsed.message || parsed.detail || parsed.error?.message || parsed.error || msg;
      } catch {}
      const err = new Error(msg);
      err.status = res.status === 401 ? 502 : res.status === 429 ? 429 : 502;
      throw err;
    }
    return res.json();
  } finally {
    // Restore original setting
    if (originalTLS !== undefined) process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTLS;
    else delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
}

/**
 * Start a try-on generation using FASHN Try-On Max.
 * Conforms to official FASHN Try-On Max documentation:
 * https://docs.fashn.ai/api-reference/tryon-max
 *
 * @param {string} modelImage - URL or base64 data URI of the person/model image
 * @param {string} productImage - URL or base64 data URI of the garment/product image
 * @param {object} [options] - Optional settings (category, generation_mode, resolution, prompt)
 * @returns {Promise<{id: string, status: string}>} prediction ID
 */
async function generateTryOn(modelImage, productImage, options = {}) {
  // Ensure both images are accessible to external provider (converts local files/URLs to base64 Data URI)
  const resolvedModelImage = toAccessibleImage(modelImage);
  const resolvedProductImage = toAccessibleImage(productImage);

  // Build Try-On Max payload adhering to official FASHN API specification
  const inputs = {
    model_image: resolvedModelImage,
    product_image: resolvedProductImage,
    generation_mode: options.generation_mode || 'balanced',
    resolution: options.resolution || '2k',
    num_images: 1,
    return_base64: false,
  };

  // Optional category-specific guidance prompt for Try-On Max
  if (options.prompt) {
    inputs.prompt = options.prompt;
  } else if (options.category) {
    const categoryPrompts = {
      shoes: 'fit shoes accurately on feet',
      bag: 'hold bag naturally in hand or on shoulder',
      necklace: 'wear necklace around neck',
      accessory: 'wear accessory naturally',
    };
    if (categoryPrompts[options.category]) {
      inputs.prompt = categoryPrompts[options.category];
    }
  }

  const payload = {
    model_name: 'tryon-max',
    inputs,
  };

  const result = await callFashn('/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { id: result.id, status: result.status || 'starting' };
}

/**
 * Check the status of a try-on prediction.
 * @param {string} predictionId
 * @returns {Promise<{id: string, status: string, output?: string, error?: string, credits_used?: number}>}
 */
async function getPredictionStatus(predictionId) {
  const result = await callFashn(`/status/${predictionId}`, { method: 'GET' });
  const outputUrl = Array.isArray(result.output) ? result.output[0] : (typeof result.output === 'string' ? result.output : null);
  const errorMsg = typeof result.error === 'object' && result.error ? (result.error.message || JSON.stringify(result.error)) : result.error;
  return {
    id: result.id,
    status: result.status, // 'starting', 'in_progress', 'completed', 'failed'
    output: outputUrl, // URL of the generated image when completed
    error: errorMsg,
    credits_used: result.credits_used,
  };
}

/**
 * Check if FASHN integration is available.
 */
function isConfigured() {
  return Boolean(config.fashn.apiKey);
}

/**
 * Return list of supported apparel categories for FASHN
 */
function getSupportedCategories() {
  return ['top', 'jacket', 'bottom', 'dress', 'shoes', 'bag', 'necklace', 'accessory'];
}

module.exports = {
  name: 'fashn',
  generateTryOn,
  getPredictionStatus,
  isConfigured,
  getSupportedCategories,
  toAccessibleImage
};
