const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const router = express.Router();

const WARDROBE_CATEGORIES = ['top', 'bottom', 'dress', 'shoes', 'bag', 'necklace', 'jacket', 'accessory'];

// Helper: Format wardrobe item with aliases
function formatItem(item) {
  if (!item) return item;
  const imageUrl = item.image_url && item.image_url.startsWith('/uploads/')
    ? `/api/wardrobe/${item.id}/image`
    : item.image_url;
  return {
    ...item,
    title: item.name,
    primaryColor: item.color,
    image_url: imageUrl,
    imageUrl,
  };
}

// ─── POST /api/wardrobe/seed-starter ─────────────────────────────────────
router.post('/seed-starter', authenticate, async (req, res) => {
  try {
    const { seedStarterWardrobeForUser } = require('../services/starterWardrobe');
    await seedStarterWardrobeForUser(db, req.user.id);
    const items = await db.query('SELECT * FROM wardrobe_items WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ message: 'Starter wardrobe populated successfully.', items: items.map(formatItem), total: items.length });
  } catch (err) {
    console.error('[Wardrobe Seed-Starter]', err);
    res.status(500).json({ error: 'Failed to populate starter wardrobe.' });
  }
});

// ─── GET /api/wardrobe ───────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM wardrobe_items WHERE user_id = ?';
    const params = [req.user.id];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC';
    const items = await db.query(sql, params);
    res.json({ items: items.map(formatItem), total: items.length });
  } catch (err) {
    console.error('[Wardrobe GET]', err);
    res.status(500).json({ error: 'Failed to fetch wardrobe.' });
  }
});

router.get('/:id/image', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT image_url FROM wardrobe_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Wardrobe item not found.' });
    const filename = path.basename(rows[0].image_url || '');
    if (!filename || filename !== rows[0].image_url.replace('/uploads/', '') || !rows[0].image_url.startsWith('/uploads/')) {
      return res.status(404).json({ error: 'Private image not found.' });
    }
    const imagePath = path.resolve(config.upload.dir, filename);
    if (!imagePath.startsWith(path.resolve(config.upload.dir) + path.sep) || !fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Private image not found.' });
    }
    res.setHeader('Cache-Control', 'private, no-store');
    return res.sendFile(imagePath);
  } catch (err) {
    console.error('[Wardrobe Image]', err);
    return res.status(500).json({ error: 'Failed to retrieve wardrobe image.' });
  }
});

// ─── GET /api/wardrobe/:id ───────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM wardrobe_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Wardrobe item not found.' });
    }
    res.json({ item: formatItem(rows[0]) });
  } catch (err) {
    console.error('[Wardrobe GET/:id]', err);
    res.status(500).json({ error: 'Failed to fetch wardrobe item.' });
  }
});

// ─── POST /api/wardrobe ─────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    try {
      const name = req.body.name || req.body.title;
      let category = (req.body.category || '').toLowerCase();
      const subcategory = req.body.subcategory;
      const color = req.body.color || req.body.primaryColor || req.body.primary_color;
      const pattern = req.body.pattern || 'Solid';
      const material = req.body.material || 'Cotton';
      const season = req.body.season || 'All Season';
      const formality = req.body.formality || 'Casual';
      const tags = req.body.tags;
      const bodyImageUrl = req.body.image_url || req.body.imageUrl;

      // Category normalizations
      if (category === 'outerwear') category = 'jacket';
      if (category === 'one_piece') category = 'dress';

      if (!name || !category || !color) {
        return res.status(400).json({ error: 'name (or title), category, and color are required.' });
      }

      if (!WARDROBE_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category must be one of: ${WARDROBE_CATEGORIES.join(', ')}` });
      }

      // Image can come from real file upload or URL in body
      let imageUrl = bodyImageUrl || '';
      if (req.file) imageUrl = `/uploads/${req.file.filename}`;

      if (!imageUrl) {
        // Fallback default silhouette if user doesn't provide photo
        imageUrl = `https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80`;
      }

      const id = uuidv4();

      if (req.file) {
        const image = fs.readFileSync(req.file.path);
        const validImage = (image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff)
          || (image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
          || (image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP');
        if (!validImage) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'The uploaded file is not a valid JPEG, PNG, or WebP image.' });
        }
      }

      await db.query(
        `INSERT INTO wardrobe_items (id, user_id, name, category, subcategory, color, pattern, material, season, formality, image_url, tags, is_favorite)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          req.user.id,
          name,
          category,
          subcategory || null,
          color,
          pattern,
          material,
          season,
          formality,
          imageUrl,
          tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : '[]',
          0
        ]
      );

      const created = await db.query('SELECT * FROM wardrobe_items WHERE id = ?', [id]);
      res.status(201).json({ message: 'Wardrobe item added.', item: formatItem(created[0]) });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('[Wardrobe POST]', err);
      res.status(500).json({ error: 'Failed to add wardrobe item.' });
    }
  }
);

// ─── PUT /api/wardrobe/:id ───────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Ownership check
    const existing = await db.query('SELECT * FROM wardrobe_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Wardrobe item not found.' });
    }

    const { name, category, subcategory, color, pattern, material, season, formality, tags, is_favorite } = req.body;

    await db.query(
      `UPDATE wardrobe_items SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        subcategory = COALESCE(?, subcategory),
        color = COALESCE(?, color),
        pattern = COALESCE(?, pattern),
        material = COALESCE(?, material),
        season = COALESCE(?, season),
        formality = COALESCE(?, formality),
        tags = COALESCE(?, tags),
        is_favorite = COALESCE(?, is_favorite)
      WHERE id = ? AND user_id = ?`,
      [name, category, subcategory, color, pattern, material, season, formality,
        tags ? JSON.stringify(tags) : null,
        is_favorite !== undefined ? (is_favorite ? 1 : 0) : null,
        req.params.id, req.user.id]
    );

    const updated = await db.query('SELECT * FROM wardrobe_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Wardrobe item updated.', item: updated[0] });
  } catch (err) {
    console.error('[Wardrobe PUT]', err);
    res.status(500).json({ error: 'Failed to update wardrobe item.' });
  }
});

// ─── DELETE /api/wardrobe/:id ────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await db.query('SELECT * FROM wardrobe_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Wardrobe item not found.' });
    }

    await db.query('DELETE FROM wardrobe_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing[0].image_url && existing[0].image_url.startsWith('/uploads/')) {
      const storedPath = path.resolve(config.upload.dir, path.basename(existing[0].image_url));
      if (storedPath.startsWith(path.resolve(config.upload.dir) + path.sep) && fs.existsSync(storedPath)) {
        fs.unlinkSync(storedPath);
      }
    }
    res.json({ message: 'Wardrobe item deleted.' });
  } catch (err) {
    console.error('[Wardrobe DELETE]', err);
    res.status(500).json({ error: 'Failed to delete wardrobe item.' });
  }
});

module.exports = router;
