const express = require('express');
const db = require('../db/connection');

const router = express.Router();

// ─── GET /api/occasions ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM occasions';
    const params = [];

    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }

    sql += ' ORDER BY name ASC';
    const occasions = await db.query(sql, params);
    res.json({ occasions });
  } catch (err) {
    console.error('[Occasions GET]', err);
    res.status(500).json({ error: 'Failed to fetch occasions.' });
  }
});

// ─── GET /api/occasions/:id ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM occasions WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Occasion not found.' });
    }
    res.json({ occasion: rows[0] });
  } catch (err) {
    console.error('[Occasions GET/:id]', err);
    res.status(500).json({ error: 'Failed to fetch occasion.' });
  }
});

module.exports = router;
