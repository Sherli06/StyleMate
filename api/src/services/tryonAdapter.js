const config = require('../config');
const fashnAdapter = require('./fashnAdapter');
const idmVtonAdapter = require('./idmVtonAdapter');

/**
 * Returns the currently active adapter instance based on configuration.
 */
function getActiveAdapter() {
  const provider = (config.tryon?.provider || 'idm-vton').toLowerCase().trim();
  if (provider === 'fashn') {
    return fashnAdapter;
  }
  return idmVtonAdapter;
}

/**
 * Returns the string name of the active try-on provider.
 */
function getActiveProviderName() {
  return getActiveAdapter().name || (config.tryon?.provider || 'idm-vton');
}

/**
 * Check if the active try-on provider is configured and available.
 */
function isConfigured() {
  const adapter = getActiveAdapter();
  return adapter.isConfigured();
}

/**
 * Returns the supported clothing categories for the active try-on provider.
 */
function getSupportedCategories() {
  const adapter = getActiveAdapter();
  return adapter.getSupportedCategories();
}

/**
 * Start a virtual try-on prediction using the active provider.
 *
 * @param {string} modelImage - URL, base64 data URI, or local path of the person
 * @param {string} productImage - URL, base64 data URI, or local path of the garment
 * @param {object} [options] - Optional settings (category, prompt, resolution, generation_mode)
 * @returns {Promise<{id: string, status: string}>}
 */
async function generateTryOn(modelImage, productImage, options = {}) {
  const adapter = getActiveAdapter();
  return await adapter.generateTryOn(modelImage, productImage, options);
}

/**
 * Check the status of an ongoing or completed try-on prediction.
 *
 * @param {string} predictionId
 * @returns {Promise<{id: string, status: string, output?: string, error?: string}>}
 */
async function getPredictionStatus(predictionId) {
  // Check if job exists in IDM-VTON job store first
  if (idmVtonAdapter.hasJob && idmVtonAdapter.hasJob(predictionId)) {
    return await idmVtonAdapter.getPredictionStatus(predictionId);
  }

  // Otherwise delegate to current active adapter
  const adapter = getActiveAdapter();
  return await adapter.getPredictionStatus(predictionId);
}

/**
 * Helper to ensure image accessibility (delegates to active adapter).
 */
function toAccessibleImage(imageUriOrPath) {
  const adapter = getActiveAdapter();
  return adapter.toAccessibleImage(imageUriOrPath);
}

module.exports = {
  getActiveAdapter,
  getActiveProviderName,
  isConfigured,
  getSupportedCategories,
  generateTryOn,
  getPredictionStatus,
  toAccessibleImage,
  fashnAdapter,
  idmVtonAdapter,
};
