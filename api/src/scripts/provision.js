/**
 * StyleMate Secure Account Provisioning & Password Reset CLI
 *
 * Safely provisions administrative or test accounts, or securely resets
 * passwords for existing accounts without committing credentials to source code.
 *
 * Usage:
 *   node src/scripts/provision.js --email user@example.com --password <SecretPassword> [--name "Full Name"] [--role admin|user]
 *
 * Or via environment variables:
 *   $env:PROVISION_EMAIL="admin@example.com"
 *   $env:PROVISION_PASSWORD="<your-secure-password>"
 *   $env:PROVISION_ROLE="admin"
 *   node src/scripts/provision.js
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

async function run() {
  const cli = parseArgs();

  const email = (cli.email || process.env.PROVISION_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = cli.password || process.env.PROVISION_PASSWORD || process.env.ADMIN_PASSWORD || '';
  const fullName = (cli.name || process.env.PROVISION_NAME || process.env.ADMIN_NAME || 'StyleMate User').trim();
  const role = (cli.role || process.env.PROVISION_ROLE || process.env.ADMIN_ROLE || 'user').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    console.error('[Error] A valid --email argument (or PROVISION_EMAIL env var) is required.');
    process.exit(1);
  }

  if (!password || typeof password !== 'string' || password.length < 10) {
    console.error('[Error] A password of at least 10 characters is required via --password (or PROVISION_PASSWORD env var).');
    process.exit(1);
  }

  if (!['user', 'admin'].includes(role)) {
    console.error('[Error] Role must be either "user" or "admin".');
    process.exit(1);
  }

  await db.initDatabase();

  const existingUsers = await db.query('SELECT id, email, full_name, role FROM users WHERE email = ?', [email]);
  const passwordHash = await bcrypt.hash(password, 12);

  if (existingUsers && existingUsers.length > 0) {
    const existing = existingUsers[0];
    const newRole = cli.role || process.env.PROVISION_ROLE ? role : existing.role;

    // Update password hash and role without touching any other user data
    await db.query(
      'UPDATE users SET password_hash = ?, role = ? WHERE id = ?',
      [passwordHash, newRole, existing.id]
    );

    // Invalidate active login sessions for security
    await db.query('DELETE FROM auth_sessions WHERE user_id = ?', [existing.id]);

    console.log(`[Provision] Password updated successfully for existing account: ${email}`);
    console.log(`[Provision] Role: ${newRole}. Previous sessions have been revoked.`);
  } else {
    // Create new account
    const userId = uuidv4();
    await db.query(
      'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [userId, email, passwordHash, fullName, role]
    );

    await db.query(
      'INSERT INTO profiles (user_id, gender, age_group, body_type, skin_tone) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Other', '25-34', 'Athletic', 'Medium']
    );

    await db.query(
      'INSERT INTO user_preferences (user_id, preferred_styles, preferred_colors, formality_level) VALUES (?, ?, ?, ?)',
      [userId, JSON.stringify(['Casual', 'Smart Casual']), JSON.stringify([]), 'Smart Casual']
    );

    console.log(`[Provision] New account successfully created: ${email}`);
    console.log(`[Provision] Role: ${role}. Ready for login.`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('[Provision] Execution failed:', err.message);
  process.exit(1);
});
