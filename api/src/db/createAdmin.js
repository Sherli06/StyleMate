const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./connection');
const migrate = require('./migrate');

async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set ADMIN_EMAIL to the administrator email before provisioning.');
  }
  await db.initDatabase();
  await migrate();
  const temporaryPassword = crypto.randomBytes(18).toString('base64url');
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  let id;
  if (existing.length) {
    id = existing[0].id;
    await db.query('UPDATE users SET role = ?, password_hash = ? WHERE id = ?', ['admin', passwordHash, id]);
    await db.query('DELETE FROM auth_sessions WHERE user_id = ?', [id]);
  } else {
    const { v4: uuidv4 } = require('uuid');
    id = uuidv4();
    await db.query(
      'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, passwordHash, 'StyleMate Administrator', 'admin']
    );
    await db.query('INSERT INTO profiles (user_id) VALUES (?)', [id]);
    await db.query(
      'INSERT INTO user_preferences (user_id, preferred_styles, preferred_colors, formality_level) VALUES (?, ?, ?, ?)',
      [id, '[]', '[]', 'Smart Casual']
    );
  }
  console.log(`Admin account provisioned: ${email}`);
  console.log(`Temporary password (shown once): ${temporaryPassword}`);
}

createAdmin()
  .catch((err) => {
    console.error('[Admin Provisioning]', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.closePool());
