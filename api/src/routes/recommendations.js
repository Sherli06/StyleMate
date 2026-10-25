const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { generateRecommendations } = require('../services/recommendationEngine');
const { getAIAdapter } = require('../services/aiAdapter');
const config = require('../config');

const router = express.Router();

// ─── POST /api/recommendations/generate ──────────────────────────────────
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { occasion_id: rawOccId, occasion: occasionName, max_outfits } = req.body;

    // 1. Fetch occasion (flexible lookup by id, key_name, or name)
    let occasionRows = [];
    if (rawOccId) {
      occasionRows = await db.query('SELECT * FROM occasions WHERE id = ? OR key_name = ? OR name = ?', [rawOccId, rawOccId, rawOccId]);
    } else if (occasionName) {
      occasionRows = await db.query('SELECT * FROM occasions WHERE name LIKE ? OR key_name LIKE ?', [`%${occasionName}%`, `%${occasionName}%`]);
    }

    if (!occasionRows || occasionRows.length === 0) {
      // Default to first occasion if not specified
      occasionRows = await db.query('SELECT * FROM occasions LIMIT 1');
    }

    if (!occasionRows || occasionRows.length === 0) {
      return res.status(404).json({ error: 'No occasion found.' });
    }
    const occasion = occasionRows[0];

    // 2. Fetch profile (ownership ensured via req.user.id)
    let profileRows = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    if (!profileRows || profileRows.length === 0) {
      await db.query("INSERT INTO profiles (user_id, body_type, skin_tone) VALUES (?, 'Hourglass', 'Medium')", [req.user.id]);
      profileRows = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    }
    const profile = profileRows[0];

    // 3. Fetch preferences
    const prefRows = await db.query('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    const preferences = prefRows && prefRows.length > 0 ? prefRows[0] : {
      preferred_styles: '[]', preferred_colors: '[]', disliked_colors: '[]',
      formality_level: 'Smart Casual', feedback_weights: '{}'
    };

    // 4. Fetch wardrobe (auto-seed starter wardrobe if user has insufficient items)
    let wardrobeItems = await db.query('SELECT * FROM wardrobe_items WHERE user_id = ?', [req.user.id]);
    if (!wardrobeItems || wardrobeItems.length < 4) {
      const { seedStarterWardrobeForUser } = require('../services/starterWardrobe');
      await seedStarterWardrobeForUser(db, req.user.id);
      wardrobeItems = await db.query('SELECT * FROM wardrobe_items WHERE user_id = ?', [req.user.id]);
    }

    // 5. Fetch weather (stub)
    const weather = null;

    // 6. Try AI adapter, fallback to rule engine
    let outfits = [];
    const aiAdapter = getAIAdapter(config.ai.provider);

    if (aiAdapter && (config.ai.geminiApiKey || config.ai.openaiApiKey)) {
      try {
        const aiResult = await aiAdapter.generateOutfitSuggestion({
          profile, preferences, wardrobeItems, occasion, weather
        });
        if (aiResult.suggestions && aiResult.suggestions.length > 0) {
          outfits = aiResult.suggestions;
        }
      } catch (aiErr) {
        console.warn('[Recommendations] AI adapter failed, falling back to rule engine:', aiErr.message);
      }
    }

    // Fallback / primary: rule-based engine
    if (outfits.length === 0) {
      outfits = generateRecommendations({
        wardrobeItems,
        occasion,
        profile,
        preferences,
        weather,
        maxOutfits: max_outfits || 3
      });
    }

    // 7. Persist generated outfits
    for (const outfit of outfits) {
      outfit.user_id = req.user.id;
      await db.query(
        `INSERT INTO outfits (id, user_id, occasion_id, occasion_name, title, description, weather_summary, ai_model_used, style_notes, match_score, is_ai_generated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [outfit.id, req.user.id, outfit.occasion_id, outfit.occasion_name, outfit.title,
          outfit.description, outfit.weather_summary, outfit.ai_model_used,
          outfit.style_notes, 0, outfit.is_ai_generated ? 1 : 0]
      );

      // Persist outfit items
      if (outfit.items) {
        for (const oi of outfit.items) {
          await db.query(
            'INSERT INTO outfit_items (id, outfit_id, wardrobe_item_id, item_role) VALUES (?, ?, ?, ?)',
            [oi.id, outfit.id, oi.wardrobe_item_id, oi.item_role]
          );
        }
      }
    }

    // Map formatted recommendations for frontend and API
    const formatted = outfits.map(({ match_score, ...o }) => ({
      ...o,
      occasion: o.occasion_name,
      reasoning: o.description || o.style_notes,
      outfit: {
        title: o.title,
        season: 'All Season',
        formality: occasion.default_formality,
        items: (o.items || []).map(oi => ({
          ...oi.item,
          id: oi.wardrobe_item_id,
          title: oi.item?.name || 'Item',
          category: oi.item?.category || oi.item_role,
          primaryColor: oi.item?.color || 'Classic',
          imageUrl: oi.item?.image_url,
          estimatedPrice: (oi.item?.category === 'jacket' ? 89 : (oi.item?.category === 'shoes' ? 75 : (oi.item?.category === 'bag' ? 55 : (oi.item?.category === 'dress' ? 95 : 45))))
        }))
      }
    }));

    res.json({
      message: `Generated ${outfits.length} outfit recommendations.`,
      weather,
      outfits: outfits.map(({ match_score, ...outfit }) => outfit),
      recommendations: formatted
    });
  } catch (err) {
    console.error('[Recommendations Generate]', err);
    res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

// ─── GET /api/recommendations ────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const outfits = await db.query(
      'SELECT id, user_id, occasion_id, occasion_name, title, description, weather_summary, ai_model_used, style_notes, is_ai_generated, created_at FROM outfits WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Attach items to each outfit
    for (const outfit of outfits) {
      const items = await db.query(
        `SELECT oi.*, wi.name, wi.category, wi.color, wi.image_url, wi.formality
         FROM outfit_items oi
         JOIN wardrobe_items wi ON oi.wardrobe_item_id = wi.id
         WHERE oi.outfit_id = ?`,
        [outfit.id]
      );
      outfit.items = items;
    }

    res.json({ outfits });
  } catch (err) {
    console.error('[Recommendations GET]', err);
    res.status(500).json({ error: 'Failed to fetch recommendations.' });
  }
});

// ─── POST /api/recommendations/:outfitId/feedback ────────────────────────
router.post('/:outfitId/feedback', authenticate, async (req, res) => {
  try {
    const { rating, feedback_text, worn } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating is required and must be 1-5.' });
    }

    // Verify outfit belongs to user
    const outfitRows = await db.query('SELECT * FROM outfits WHERE id = ? AND user_id = ?', [req.params.outfitId, req.user.id]);
    if (!outfitRows || outfitRows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found.' });
    }

    const feedbackId = uuidv4();
    await db.query(
      `INSERT INTO recommendation_feedback (id, user_id, outfit_id, rating, feedback_text, worn)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [feedbackId, req.user.id, req.params.outfitId, rating, feedback_text || null, worn ? 1 : 0]
    );

    // Update feedback weights based on rating
    if (rating >= 4) {
      const outfitItemRows = await db.query(
        `SELECT wi.category, wi.color FROM outfit_items oi
         JOIN wardrobe_items wi ON oi.wardrobe_item_id = wi.id
         WHERE oi.outfit_id = ?`,
        [req.params.outfitId]
      );

      const prefRows = await db.query('SELECT feedback_weights FROM user_preferences WHERE user_id = ?', [req.user.id]);
      let weights = {};
      if (prefRows && prefRows.length > 0 && prefRows[0].feedback_weights) {
        try { weights = JSON.parse(prefRows[0].feedback_weights); } catch {}
      }

      for (const item of outfitItemRows) {
        weights[item.category] = (weights[item.category] || 1) + 0.05;
        const colorKey = `color_${item.color}`;
        weights[colorKey] = (weights[colorKey] || 1) + 0.03;
      }

      await db.query(
        'UPDATE user_preferences SET feedback_weights = ? WHERE user_id = ?',
        [JSON.stringify(weights), req.user.id]
      );
    }

    res.status(201).json({ message: 'Feedback recorded.', feedback_id: feedbackId });
  } catch (err) {
    console.error('[Feedback POST]', err);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

module.exports = router;
