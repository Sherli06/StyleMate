const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../db/connection');
const tryonAdapter = require('../services/tryonAdapter');

/**
 * GET /api/tryon/config
 * Public endpoint — lets the frontend know if try-on is available and which provider is active.
 */
router.get('/config', (req, res) => {
  res.json({
    available: tryonAdapter.isConfigured(),
    provider: tryonAdapter.getActiveProviderName(),
    supported_categories: tryonAdapter.getSupportedCategories(),
  });
});

/**
 * POST /api/tryon/generate
 * Start a virtual try-on generation.
 * Requires authentication.
 */
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const { product_id, model_image, consent } = req.body;

    // Validate consent
    if (consent !== true) {
      return res.status(400).json({
        error: 'You must consent to sending images to the external try-on provider.',
      });
    }

    // Validate model_image
    if (!model_image || typeof model_image !== 'string' || !model_image.trim()) {
      return res.status(400).json({ error: 'model_image is required and must be a non-empty string.' });
    }

    // Validate product_id
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required.' });
    }

    // Check provider configuration
    if (!tryonAdapter.isConfigured()) {
      return res.status(503).json({
        error: `Virtual try-on is not available. Provider "${tryonAdapter.getActiveProviderName()}" is not configured.`,
      });
    }

    // Look up product (check catalogue products first, then wardrobe items)
    let rows = await db.query('SELECT id, name, image_url, category FROM products WHERE id = ?', [product_id]);
    if (!rows || rows.length === 0) {
      rows = await db.query('SELECT id, name, image_url, category FROM wardrobe_items WHERE id = ?', [product_id]);
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Product or wardrobe item not found.' });
    }

    const product = rows[0];
    if (!product.image_url) {
      return res.status(400).json({ error: 'Product does not have an image available for try-on.' });
    }

    // Validate category against provider supported categories
    const supportedCategories = tryonAdapter.getSupportedCategories();
    const productCategory = (product.category || '').toLowerCase();
    if (!supportedCategories.includes(productCategory)) {
      return res.status(400).json({
        error: `The selected product category "${product.category}" is not supported for virtual try-on by the active provider (${tryonAdapter.getActiveProviderName()}). Supported categories: ${supportedCategories.join(', ')}.`,
      });
    }

    // Generate try-on using the active provider adapter
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.removeHeader('ETag');

    const result = await tryonAdapter.generateTryOn(model_image.trim(), product.image_url, {
      category: product.category,
      prompt: req.body.prompt,
      generation_mode: req.body.generation_mode,
      resolution: req.body.resolution
    });

    return res.status(200).json({
      prediction_id: result.id,
      status: result.status,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/tryon/status/:predictionId
 * Check the status of a try-on prediction.
 * Requires authentication.
 */
router.get('/status/:predictionId', authenticate, async (req, res, next) => {
  try {
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.removeHeader('ETag');

    const { predictionId } = req.params;
    if (!predictionId) {
      return res.status(400).json({ error: 'predictionId parameter is required.' });
    }

    const result = await tryonAdapter.getPredictionStatus(predictionId);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
