const db = require('./connection');

const tables = [
  // 1. Users
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 2. Profiles (Gender, age, height, body type, skin tone, face shape, hair type, country, language, style history)
  `CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(36) PRIMARY KEY,
    gender VARCHAR(30) NOT NULL DEFAULT 'Female',
    age_group VARCHAR(30) NOT NULL DEFAULT '18-24',
    height_category VARCHAR(50) NOT NULL DEFAULT 'Average (160-175cm)',
    body_type VARCHAR(50) NOT NULL DEFAULT 'Hourglass',
    skin_tone VARCHAR(50) NOT NULL DEFAULT 'Medium',
    face_shape VARCHAR(50) NOT NULL DEFAULT 'Oval',
    hair_type VARCHAR(50) NOT NULL DEFAULT 'Wavy',
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    language VARCHAR(50) NOT NULL DEFAULT 'English',
    style_history TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // 3. User Preferences
  `CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(36) PRIMARY KEY,
    preferred_styles TEXT NOT NULL,
    preferred_colors TEXT NOT NULL,
    disliked_colors TEXT,
    formality_level VARCHAR(50) NOT NULL DEFAULT 'Smart Casual',
    feedback_weights TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // 4. Occasions
  `CREATE TABLE IF NOT EXISTS occasions (
    id VARCHAR(50) PRIMARY KEY,
    key_name VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    default_formality VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    tags TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 5. Wardrobe Items
  `CREATE TABLE IF NOT EXISTS wardrobe_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(80),
    color VARCHAR(50) NOT NULL,
    pattern VARCHAR(50) DEFAULT 'Solid',
    material VARCHAR(50) DEFAULT 'Cotton',
    season VARCHAR(50) DEFAULT 'All Season',
    formality VARCHAR(50) DEFAULT 'Casual',
    image_url TEXT NOT NULL,
    tags TEXT,
    is_favorite BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // 6. Outfits
  `CREATE TABLE IF NOT EXISTS outfits (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    occasion_id VARCHAR(50) NOT NULL,
    occasion_name VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    weather_summary VARCHAR(150),
    ai_model_used VARCHAR(80) NOT NULL DEFAULT 'rule-matrix-v1',
    style_notes TEXT,
    match_score INT NOT NULL DEFAULT 95,
    is_ai_generated BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // 7. Outfit Items Link
  `CREATE TABLE IF NOT EXISTS outfit_items (
    id VARCHAR(36) PRIMARY KEY,
    outfit_id VARCHAR(36) NOT NULL,
    wardrobe_item_id VARCHAR(36) NOT NULL,
    item_role VARCHAR(50) NOT NULL,
    FOREIGN KEY (outfit_id) REFERENCES outfits(id) ON DELETE CASCADE,
    FOREIGN KEY (wardrobe_item_id) REFERENCES wardrobe_items(id) ON DELETE CASCADE
  )`,

  // 8. Recommendation Feedback
  `CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    outfit_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL,
    feedback_text TEXT,
    worn BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (outfit_id) REFERENCES outfits(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
    email VARCHAR(191) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    window_started_at DATETIME NOT NULL,
    locked_until DATETIME,
    PRIMARY KEY (email, ip_address)
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    image_source TEXT,
    price_cents INT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    availability VARCHAR(20) NOT NULL DEFAULT 'sample',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS product_occasions (
    product_id VARCHAR(36) NOT NULL,
    occasion_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (product_id, occasion_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (occasion_id) REFERENCES occasions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS user_favorites (
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )`,
];

async function migrate() {
  await db.initDatabase();
  console.log(`[Migrate] Running migrations on engine: ${db.getEngine()}...`);

  for (const tableSql of tables) {
    await db.query(tableSql);
  }

  await ensureColumn('users', 'role', "VARCHAR(20) NOT NULL DEFAULT 'user'");
  await ensureColumn('profiles', 'style_preference', 'VARCHAR(80)');

  console.log('[Migrate] All StyleMate tables successfully migrated.');
}

async function ensureColumn(table, column, definition) {
  const rows = db.getEngine() === 'mysql'
    ? await db.query('SELECT COLUMN_NAME AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?', [table, column])
    : await db.query(`PRAGMA table_info(${table})`);
  if (rows.some((row) => row.name === column)) return;
  await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log('[Migrate] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrate] Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrate;
