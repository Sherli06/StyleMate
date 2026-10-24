const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const PROFILE_ENUMS = require('../services/profileOptions');

const router = express.Router();

// Helper: Case-insensitive enum matching
function matchEnum(val, list) {
  if (!val) return null;
  const found = list.find(item => item.toLowerCase() === String(val).trim().toLowerCase());
  return found || val;
}

// ─── GET /api/profile ────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found. Please complete onboarding.' });
    }
    const prof = rows[0];
    res.json({
      profile: {
        ...prof,
        bodyType: prof.body_type,
        skinTone: prof.skin_tone,
        heightCategory: prof.height_category,
        faceShape: prof.face_shape,
        hairType: prof.hair_type,
        styleHistory: prof.style_history,
      },
      enums: PROFILE_ENUMS
    });
  } catch (err) {
    console.error('[Profile GET]', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ─── PUT /api/profile ────────────────────────────────────────────────────
router.put('/', authenticate, async (req, res) => {
  try {
    let gender = req.body.gender;
    let age_group = req.body.age_group || req.body.ageGroup;
    let height_category = req.body.height_category || req.body.heightCategory;
    let body_type = req.body.body_type || req.body.bodyType;
    let skin_tone = req.body.skin_tone || req.body.skinTone;
    let face_shape = req.body.face_shape || req.body.faceShape;
    let hair_type = req.body.hair_type || req.body.hairType;
    let country = req.body.country;
    let language = req.body.language;
    let style_history = req.body.style_history || req.body.styleHistory;

    // Normalize enum casings
    if (gender) gender = matchEnum(gender, PROFILE_ENUMS.gender);
    if (age_group) age_group = matchEnum(age_group, PROFILE_ENUMS.age_group);
    if (height_category) height_category = matchEnum(height_category, PROFILE_ENUMS.height_category);
    if (body_type) body_type = matchEnum(body_type, PROFILE_ENUMS.body_type);
    if (skin_tone) skin_tone = matchEnum(skin_tone, PROFILE_ENUMS.skin_tone);
    if (face_shape) face_shape = matchEnum(face_shape, PROFILE_ENUMS.face_shape);
    if (hair_type) hair_type = matchEnum(hair_type, PROFILE_ENUMS.hair_type);

    // Validate enum values
    if (gender && !PROFILE_ENUMS.gender.includes(gender)) {
      return res.status(400).json({ error: `Invalid gender. Choose from: ${PROFILE_ENUMS.gender.join(', ')}` });
    }
    if (age_group && !PROFILE_ENUMS.age_group.includes(age_group)) {
      return res.status(400).json({ error: `Invalid age_group. Choose from: ${PROFILE_ENUMS.age_group.join(', ')}` });
    }
    if (height_category && !PROFILE_ENUMS.height_category.includes(height_category)) {
      return res.status(400).json({ error: `Invalid height_category. Choose from: ${PROFILE_ENUMS.height_category.join(', ')}` });
    }
    if (body_type && !PROFILE_ENUMS.body_type.includes(body_type)) {
      return res.status(400).json({ error: `Invalid body_type. Choose from: ${PROFILE_ENUMS.body_type.join(', ')}` });
    }
    if (skin_tone && !PROFILE_ENUMS.skin_tone.includes(skin_tone)) {
      return res.status(400).json({ error: `Invalid skin_tone. Choose from: ${PROFILE_ENUMS.skin_tone.join(', ')}` });
    }
    if (face_shape && !PROFILE_ENUMS.face_shape.includes(face_shape)) {
      return res.status(400).json({ error: `Invalid face_shape. Choose from: ${PROFILE_ENUMS.face_shape.join(', ')}` });
    }
    if (hair_type && !PROFILE_ENUMS.hair_type.includes(hair_type)) {
      return res.status(400).json({ error: `Invalid hair_type. Choose from: ${PROFILE_ENUMS.hair_type.join(', ')}` });
    }

    await db.query(
      `UPDATE profiles SET
        gender = COALESCE(?, gender),
        age_group = COALESCE(?, age_group),
        height_category = COALESCE(?, height_category),
        body_type = COALESCE(?, body_type),
        skin_tone = COALESCE(?, skin_tone),
        face_shape = COALESCE(?, face_shape),
        hair_type = COALESCE(?, hair_type),
        country = COALESCE(?, country),
        language = COALESCE(?, language),
        style_history = COALESCE(?, style_history)
      WHERE user_id = ?`,
      [gender, age_group, height_category, body_type, skin_tone, face_shape, hair_type, country, language, style_history, req.user.id]
    );

    const updated = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const p = updated[0];
    res.json({
      message: 'Profile updated successfully.',
      profile: {
        ...p,
        bodyType: p.body_type,
        skinTone: p.skin_tone,
        heightCategory: p.height_category,
        faceShape: p.face_shape,
        hairType: p.hair_type,
        styleHistory: p.style_history,
      }
    });
  } catch (err) {
    console.error('[Profile PUT]', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ─── GET /api/profile/enums ──────────────────────────────────────────────
router.get('/enums', (req, res) => {
  res.json({ enums: PROFILE_ENUMS });
});

// ─── GET /api/profile/preferences ────────────────────────────────────────
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found.' });
    }
    const prefs = rows[0];
    // Parse JSON fields
    try { prefs.preferred_styles = JSON.parse(prefs.preferred_styles); } catch {}
    try { prefs.preferred_colors = JSON.parse(prefs.preferred_colors); } catch {}
    try { prefs.disliked_colors = JSON.parse(prefs.disliked_colors); } catch {}
    try { prefs.feedback_weights = JSON.parse(prefs.feedback_weights); } catch {}
    res.json({ preferences: prefs });
  } catch (err) {
    console.error('[Preferences GET]', err);
    res.status(500).json({ error: 'Failed to fetch preferences.' });
  }
});

// ─── PUT /api/profile/preferences ────────────────────────────────────────
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { preferred_styles, preferred_colors, disliked_colors, formality_level } = req.body;

    await db.query(
      `UPDATE user_preferences SET
        preferred_styles = COALESCE(?, preferred_styles),
        preferred_colors = COALESCE(?, preferred_colors),
        disliked_colors = COALESCE(?, disliked_colors),
        formality_level = COALESCE(?, formality_level)
      WHERE user_id = ?`,
      [
        preferred_styles ? JSON.stringify(preferred_styles) : null,
        preferred_colors ? JSON.stringify(preferred_colors) : null,
        disliked_colors ? JSON.stringify(disliked_colors) : null,
        formality_level,
        req.user.id
      ]
    );

    const updated = await db.query('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    const prefs = updated[0];
    try { prefs.preferred_styles = JSON.parse(prefs.preferred_styles); } catch {}
    try { prefs.preferred_colors = JSON.parse(prefs.preferred_colors); } catch {}
    try { prefs.disliked_colors = JSON.parse(prefs.disliked_colors); } catch {}
    try { prefs.feedback_weights = JSON.parse(prefs.feedback_weights); } catch {}
    res.json({ message: 'Preferences updated.', preferences: prefs });
  } catch (err) {
    console.error('[Preferences PUT]', err);
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

module.exports = router;
