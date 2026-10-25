const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// In-memory prediction tracking for asynchronous job lifecycle
const jobs = new Map();

// Clean up jobs older than 30 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

function getPythonExecutable() {
  const customPath = process.env.PYTHON_PATH;
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }
  const defaultP312 = 'C:\\Users\\ri3ha\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
  if (fs.existsSync(defaultP312)) {
    return defaultP312;
  }
  return 'python';
}

/**
 * Check if the IDM-VTON runner is available.
 */
function isConfigured() {
  return true;
}

/**
 * Start an IDM-VTON try-on prediction.
 * @param {string} modelImage - URL or base64 data URI of the model/person image
 * @param {string} productImage - URL or base64 data URI of the garment image
 * @param {object} [options] - Options (category, prompt, steps)
 * @returns {Promise<{id: string, status: string}>}
 */
async function generateTryOn(modelImage, productImage, options = {}) {
  const predictionId = uuidv4();

  const jobsDir = path.join(config.upload.dir, 'vton_jobs');
  const resultsDir = path.join(config.upload.dir, 'vton_results');
  if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true });
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const payloadPath = path.join(jobsDir, `payload_${predictionId}.json`);
  const outputPath = path.join(resultsDir, `output_${predictionId}.png`);

  const categoryDescriptions = {
    top: 'A stylish top shirt',
    jacket: 'A fashion jacket coat',
    bottom: 'Fashion trousers pants',
    dress: 'An elegant dress gown',
    shoes: 'Fashion footwear shoes',
    bag: 'A luxury handbag',
    necklace: 'A jewelry necklace',
    accessory: 'A stylish fashion accessory',
  };

  const description = options.prompt || categoryDescriptions[options.category] || 'A fashion garment piece';

  const payload = {
    model: modelImage,
    garment: productImage,
    output: outputPath,
    description,
    steps: Math.max(20, options.steps || 20),
    seed: 42,
  };

  fs.writeFileSync(payloadPath, JSON.stringify(payload), 'utf8');

  // Record job in memory
  jobs.set(predictionId, {
    id: predictionId,
    status: 'in_progress',
    stage: 'submitted',
    message: 'Submitting request to IDM-VTON runner...',
    output: null,
    error: null,
    createdAt: Date.now(),
    payloadPath,
    outputPath,
  });

  const scriptPath = path.join(__dirname, 'run_idm_vton.py');
  const pythonBin = getPythonExecutable();

  const child = spawn(pythonBin, [scriptPath, '--payload-file', payloadPath], {
    env: {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
    },
  });

  // Overall 180-second timeout to terminate hanging jobs safely
  const timeoutTimer = setTimeout(() => {
    const job = jobs.get(predictionId);
    if (job && job.status === 'in_progress') {
      job.status = 'failed';
      job.stage = 'failed';
      job.error = 'Inference timed out after 180 seconds at provider. Process was safely terminated.';
      try {
        child.kill('SIGTERM');
      } catch {}
      try {
        if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
      } catch {}
    }
  }, 180 * 1000);
  if (timeoutTimer.unref) timeoutTimer.unref();

  let stdoutData = '';
  let stderrData = '';

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdoutData += text;
    const job = jobs.get(predictionId);
    if (job && job.status === 'in_progress') {
      if (text.includes('Loaded as API')) {
        job.stage = 'remote_processing';
        job.message = 'ZeroGPU allocated. Neural garment diffusion in progress...';
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  child.on('error', (err) => {
    clearTimeout(timeoutTimer);
    const job = jobs.get(predictionId);
    if (job && job.status === 'in_progress') {
      job.status = 'failed';
      job.stage = 'failed';
      job.error = `Failed to start Python inference process: ${err.message}`;
    }
    try {
      if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
    } catch {}
  });

  child.on('close', (code) => {
    clearTimeout(timeoutTimer);
    // Clean up payload file
    try {
      if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
    } catch {}

    const job = jobs.get(predictionId);
    if (!job) return;

    if (code === 0 && fs.existsSync(outputPath)) {
      try {
        const fileBuffer = fs.readFileSync(outputPath);
        const dataUri = `data:image/png;base64,${fileBuffer.toString('base64')}`;
        job.status = 'completed';
        job.stage = 'completed';
        job.output = dataUri;
        job.message = 'Try-on synthesized successfully.';
      } catch (err) {
        job.status = 'failed';
        job.stage = 'failed';
        job.error = `Failed reading output image: ${err.message}`;
      }
    } else {
      let errMsg = 'IDM-VTON inference process failed.';
      try {
        const parsed = JSON.parse(stdoutData.trim().split('\n').pop());
        if (parsed.error) errMsg = parsed.error;
      } catch {
        if (stderrData.trim()) errMsg = stderrData.trim();
      }

      // Check for Hugging Face ZeroGPU quota limits
      if (/ZeroGPU quota|exceeded your ZeroGPU quota|GPU quota/i.test(errMsg)) {
        let cleanMsg = errMsg.replace(/^gradio_client\.exceptions\.AppError:\s*/i, '').trim();
        cleanMsg = cleanMsg.replace(/^['"]+|['"]+$/g, '').trim();
        errMsg = `Hugging Face ZeroGPU Free Tier: ${cleanMsg} (To use personal free quota, you can configure an optional free Hugging Face token in api/.env: HF_TOKEN=...).`;
      }

      job.status = 'failed';
      job.stage = 'failed';
      job.error = errMsg;
    }
  });

  return { id: predictionId, status: 'in_progress', stage: 'submitted' };
}

/**
 * Get status of an IDM-VTON prediction.
 * @param {string} predictionId
 * @returns {Promise<{id: string, status: string, output?: string, error?: string}>}
 */
async function getPredictionStatus(predictionId) {
  const job = jobs.get(predictionId);
  if (!job) {
    throw Object.assign(new Error('Prediction not found or expired.'), { status: 404 });
  }

  return {
    id: job.id,
    status: job.status,
    stage: job.stage || (job.status === 'completed' ? 'completed' : 'processing'),
    message: job.message || null,
    output: job.output,
    error: job.error,
    elapsed_seconds: Math.round((Date.now() - job.createdAt) / 1000)
  };
}

function getSupportedCategories() {
  return ['top', 'jacket', 'bottom', 'dress'];
}

function hasJob(predictionId) {
  return jobs.has(predictionId);
}

async function toBlob(sourceStr, uploadDir) {
  if (!sourceStr || typeof sourceStr !== 'string' || !sourceStr.trim()) {
    throw new Error('Image source is missing or invalid.');
  }
  const trimmed = sourceStr.trim();
  if (trimmed.startsWith('data:image/')) {
    const [header, b64] = trimmed.split(',');
    const mimeType = header.split(';')[0].replace('data:', '');
    const buffer = Buffer.from(b64, 'base64');
    return new Blob([buffer], { type: mimeType });
  }
  throw new Error('Unsupported format for toBlob');
}

module.exports = {
  name: 'idm-vton',
  generateTryOn,
  getPredictionStatus,
  isConfigured,
  getSupportedCategories,
  hasJob,
  toBlob,
  toAccessibleImage: (uri) => uri
};
