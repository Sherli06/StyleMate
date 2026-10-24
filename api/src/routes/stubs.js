const express = require('express');
const { authenticate } = require('../middleware/auth');
const weatherAdapter = require('../services/weatherAdapter');
const stubs = require('../services/stubs');

const router = express.Router();

// ─── GET /api/weather ────────────────────────────────────────────────────
router.get('/weather', async (req, res) => {
  try {
    const city = req.query.city || 'Mumbai';
    const country = req.query.country || 'IN';
    const weather = await weatherAdapter.getCurrentWeather(city, country);
    res.json({ weather });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// ─── POST /api/stubs/ar-tryon ────────────────────────────────────────────
router.post('/ar-tryon', authenticate, async (req, res) => {
  const result = await stubs.arTryOn.startTryOn(req.user.id, req.body.outfit_id);
  res.json(result);
});

// ─── POST /api/stubs/voice ───────────────────────────────────────────────
router.post('/voice', authenticate, async (req, res) => {
  const result = await stubs.voiceAssistant.processVoiceCommand(null);
  res.json(result);
});

// ─── POST /api/stubs/chat ────────────────────────────────────────────────
router.post('/chat', authenticate, async (req, res) => {
  const result = await stubs.chatbot.chat(req.user.id, req.body.message);
  res.json(result);
});

module.exports = router;
