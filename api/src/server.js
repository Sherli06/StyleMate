const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./db/connection');
const migrate = require('./db/migrate');
const seed = require('./db/seed');

// Route imports
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const wardrobeRoutes = require('./routes/wardrobe');
const occasionRoutes = require('./routes/occasions');
const recommendationRoutes = require('./routes/recommendations');
const stubRoutes = require('./routes/stubs');
const productRoutes = require('./routes/products');
const favoritesRoutes = require('./routes/favorites');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the React web app from web/build
const webBuildPath = path.resolve(__dirname, '../../web/build');
app.use(express.static(webBuildPath));

// ─── API Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/occasions', occasionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/stubs', stubRoutes);
app.use('/api/products', productRoutes);
app.use('/api/favorites', favoritesRoutes);

// ─── Health Check ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'StyleMate API',
    version: '1.0.0',
    engine: db.getEngine(),
    timestamp: new Date().toISOString()
  });
});

// ─── SPA Fallback (serve React app for unknown routes) ───────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(webBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('StyleMate Web — run "npm run build" in web/ to enable the frontend.');
    }
  });
});

// ─── Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Max size: ${config.upload.maxSizeBytes / 1024 / 1024}MB` });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected upload field.' });
  }
  if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Server Startup ──────────────────────────────────────────────────────
async function startServer() {
  try {
    await db.initDatabase();
    await migrate();
    await seed();
    console.log('[StyleMate] Database ready.');

    const server = app.listen(config.port, () => {
      console.log(`\n🎨 StyleMate API running at http://localhost:${config.port}`);
      console.log(`   Database engine: ${db.getEngine()}`);
      console.log(`   AI Provider: ${config.ai.provider}`);
      console.log(`   Environment: ${config.nodeEnv}\n`);
    });

    return server;
  } catch (err) {
    console.error('[StyleMate] Failed to start server:', err);
    process.exit(1);
  }
}

// Only auto-start if this is the main module (not imported for tests)
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
