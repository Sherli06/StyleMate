const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const CATEGORIES = ['top', 'bottom', 'dress', 'shoes', 'bag', 'necklace', 'jacket', 'accessory'];

router.get('/', async (req, res, next) => {
  try {
    const { category, occasion_id: occasionId, occasion } = req.query;
    const conditions = [];
    const params = [];
    if (category) {
      if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Unknown product category.' });
      conditions.push('p.category = ?');
      params.push(category);
    }
    const selectedOccasion = occasionId || occasion;
    if (selectedOccasion) {
      conditions.push('EXISTS (SELECT 1 FROM product_occasions po JOIN occasions o ON o.id = po.occasion_id WHERE po.product_id = p.id AND (o.id = ? OR o.key_name = ?))');
      params.push(selectedOccasion, selectedOccasion);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const products = await db.query(
      `SELECT p.id, p.name, p.category, p.image_url, p.image_source, p.description,
              GROUP_CONCAT(DISTINCT o.key_name) AS occasions
       FROM products p
       LEFT JOIN product_occasions po ON po.product_id = p.id
       LEFT JOIN occasions o ON o.id = po.occasion_id
       ${where} GROUP BY p.id ORDER BY p.created_at DESC`,
      params
    );
    return res.json({ products: products.map((product) => ({
      ...product,
      occasions: product.occasions ? product.occasions.split(',') : []
    })) });
  } catch (err) {
    return next(err);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, category, image_url: imageUrl, image_source: imageSource, description, occasions } = req.body;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 160) {
      return res.status(400).json({ error: 'Product name is required (maximum 160 characters).' });
    }
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
    let parsedUrl;
    try { parsedUrl = new URL(imageUrl); } catch { return res.status(400).json({ error: 'A valid image_url is required.' }); }
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) return res.status(400).json({ error: 'Product images must use HTTP or HTTPS.' });
    const source = typeof imageSource === 'string' ? imageSource.trim() : '';
    if (!source || source.length > 500) return res.status(400).json({ error: 'A source or reuse-license URL is required (maximum 500 characters).' });
    try {
      const parsedSource = new URL(source);
      if (!['https:', 'http:'].includes(parsedSource.protocol)) throw new Error('Invalid source protocol.');
    } catch {
      return res.status(400).json({ error: 'A valid HTTP or HTTPS image source / reuse-license URL is required.' });
    }
    if (!Array.isArray(occasions) || occasions.length === 0 || occasions.some((key) => typeof key !== 'string')) {
      return res.status(400).json({ error: 'Select at least one occasion tag.' });
    }
    const uniqueOccasions = [...new Set(occasions)];
    const known = await db.query(
      `SELECT id, key_name FROM occasions WHERE key_name IN (${uniqueOccasions.map(() => '?').join(',')})`,
      uniqueOccasions
    );
    if (known.length !== uniqueOccasions.length) return res.status(400).json({ error: 'One or more occasion tags are unknown.' });
    const id = uuidv4();
    await db.query(
      `INSERT INTO products (id, name, category, image_url, image_source, price_cents, availability, description)
       VALUES (?, ?, ?, ?, ?, 0, 'sample', ?)`,
      [id, name.trim(), category, parsedUrl.href, source, description || null]
    );
    for (const occasionRow of known) {
      await db.query('INSERT INTO product_occasions (product_id, occasion_id) VALUES (?, ?)', [id, occasionRow.id]);
    }
    const rows = await db.query(
      'SELECT id, name, category, image_url, image_source, description FROM products WHERE id = ?',
      [id]
    );
    return res.status(201).json({ product: { ...rows[0], occasions: uniqueOccasions } });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const existing = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Catalogue product deleted successfully.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
