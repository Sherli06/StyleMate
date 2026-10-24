const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../db/connection');

const router = express.Router();

async function getFavorites(userId) {
  return db.query(
    `SELECT p.id, p.name, p.category, p.image_url, p.description,
            GROUP_CONCAT(DISTINCT o.key_name) AS occasions
     FROM user_favorites f
     JOIN products p ON p.id = f.product_id
     LEFT JOIN product_occasions po ON po.product_id = p.id
     LEFT JOIN occasions o ON o.id = po.occasion_id
     WHERE f.user_id = ?
     GROUP BY p.id
     ORDER BY p.name`,
    [userId]
  ).then((products) => products.map((product) => ({
    ...product,
    occasions: product.occasions ? product.occasions.split(',') : []
  })));
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    return res.json({ products: await getFavorites(req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.post('/:productId', authenticate, async (req, res, next) => {
  try {
    const products = await db.query('SELECT id FROM products WHERE id = ?', [req.params.productId]);
    if (!products.length) return res.status(404).json({ error: 'Catalogue item not found.' });
    const insert = db.getEngine() === 'mysql' ? 'INSERT IGNORE' : 'INSERT OR IGNORE';
    await db.query(
      `${insert} INTO user_favorites (user_id, product_id) VALUES (?, ?)`,
      [req.user.id, req.params.productId]
    );
    return res.json({ products: await getFavorites(req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:productId', authenticate, async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    return res.json({ products: await getFavorites(req.user.id) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
