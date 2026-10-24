const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { authenticate, hashToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const PROFILE_ENUMS = require('../services/profileOptions');

const router = express.Router();
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 30 * 60 * 1000;
const SESSION_DAYS = 7;
const COOKIE_OPTIONS = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;

function sqlDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function parseDatabaseDate(value) {
  if (value instanceof Date) return value;
  return new Date(`${String(value).replace(' ', 'T')}Z`);
}

async function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.query(
    'INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    [hashToken(token), user.id, sqlDate(expiresAt)]
  );
  return token;
}

router.post(
  '/register',
  (req, res, next) => {
    if (!req.body.full_name && req.body.name) req.body.full_name = req.body.name;
    next();
  },
  validate({
    email: { required: true, type: 'email', max: 191 },
    password: { required: true, type: 'string', min: 10, max: 128 },
    full_name: { required: true, type: 'string', min: 1, max: 100 }
  }),
  async (req, res, next) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const fullName = req.body.full_name.trim();
      if (!fullName) return res.status(400).json({ error: 'full_name cannot be blank.' });
      const profileInput = {};
      for (const field of ['gender', 'age_group', 'body_type', 'skin_tone']) {
        const submitted = req.body[field];
        if (submitted === undefined) continue;
        if (typeof submitted !== 'string') return res.status(400).json({ error: `${field} must be a valid profile option.` });
        const normalized = PROFILE_ENUMS[field].find((option) => option.toLowerCase() === submitted.trim().toLowerCase());
        if (!normalized) return res.status(400).json({ error: `${field} must be one of: ${PROFILE_ENUMS[field].join(', ')}` });
        profileInput[field] = normalized;
      }
      const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ error: 'An account with this email already exists.' });

      const id = uuidv4();
      const passwordHash = await bcrypt.hash(req.body.password, 12);
      await db.query(
        'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
        [id, email, passwordHash, fullName, 'user']
      );
      await db.query(
        `INSERT INTO profiles (user_id, gender, age_group, body_type, skin_tone)
         VALUES (?, ?, ?, ?, ?)`,
        [id, profileInput.gender || 'Other', profileInput.age_group || '18-24', profileInput.body_type || 'Athletic', profileInput.skin_tone || 'Medium']
      );
      await db.query(
        `INSERT INTO user_preferences (user_id, preferred_styles, preferred_colors, formality_level)
         VALUES (?, ?, ?, ?)`,
        [id, JSON.stringify(['Casual']), JSON.stringify([]), 'Smart Casual']
      );

      const user = { id, email, full_name: fullName, name: fullName, role: 'user' };
      const token = await createSession(user);
      res.setHeader('Set-Cookie', `stylemate_session=${encodeURIComponent(token)}; ${COOKIE_OPTIONS}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
      const response = { message: 'Account created successfully.', user };
      if (req.get('X-StyleMate-Client') === 'mobile') response.token = token;
      return res.status(201).json(response);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || /UNIQUE constraint failed/i.test(err.message)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      return next(err);
    }
  }
);

router.post('/login', validate({
  email: { required: true, type: 'email', max: 191 },
  password: { required: true, type: 'string', min: 1, max: 128 }
}), async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const ipAddress = String(req.ip || 'unknown').slice(0, 64);
    const now = new Date();
    const attempts = await db.query('SELECT * FROM login_attempts WHERE email = ? AND ip_address = ?', [email, ipAddress]);
    const attempt = attempts[0];
    if (attempt && attempt.locked_until && parseDatabaseDate(attempt.locked_until) > now) {
      return res.status(429).json({ error: 'Too many sign-in attempts. Try again later.' });
    }

    const users = await db.query('SELECT id, email, full_name, password_hash, role FROM users WHERE email = ?', [email]);
    const user = users[0];
    const valid = user ? await bcrypt.compare(req.body.password, user.password_hash) : await bcrypt.compare(req.body.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid');
    if (!valid) {
      const elapsed = attempt ? now.getTime() - parseDatabaseDate(attempt.window_started_at).getTime() : NaN;
      const withinWindow = Number.isFinite(elapsed) && elapsed >= 0 && elapsed < LOGIN_WINDOW_MS;
      const count = withinWindow ? Number(attempt.attempts) + 1 : 1;
      const lockedUntil = count >= MAX_LOGIN_ATTEMPTS ? sqlDate(new Date(now.getTime() + LOCKOUT_MS)) : null;
      if (attempt) {
        await db.query(
          'UPDATE login_attempts SET attempts = ?, window_started_at = ?, locked_until = ? WHERE email = ? AND ip_address = ?',
          [count, withinWindow ? attempt.window_started_at : sqlDate(now), lockedUntil, email, ipAddress]
        );
      } else {
        await db.query(
          'INSERT INTO login_attempts (email, ip_address, attempts, window_started_at, locked_until) VALUES (?, ?, ?, ?, ?)',
          [email, ipAddress, count, sqlDate(now), lockedUntil]
        );
      }
      return res.status(count >= MAX_LOGIN_ATTEMPTS ? 429 : 401).json({ error: 'Invalid email or password.' });
    }

    await db.query('DELETE FROM login_attempts WHERE email = ? AND ip_address = ?', [email, ipAddress]);
    const token = await createSession(user);
    res.setHeader('Set-Cookie', `stylemate_session=${encodeURIComponent(token)}; ${COOKIE_OPTIONS}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    const response = {
      message: 'Login successful.',
      user: { id: user.id, email: user.email, full_name: user.full_name, name: user.full_name, role: user.role }
    };
    if (req.get('X-StyleMate-Client') === 'mobile') response.token = token;
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await db.query('DELETE FROM auth_sessions WHERE token_hash = ?', [req.sessionTokenHash]);
    res.setHeader('Set-Cookie', `stylemate_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return res.json({ message: 'Logged out.' });
  } catch (err) {
    return next(err);
  }
});

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { current_password: currentPassword, new_password: newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 12 || newPassword.length > 128) {
      return res.status(400).json({ error: 'current_password and a new_password of 12-128 characters are required.' });
    }
    const rows = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);
    await db.query('DELETE FROM auth_sessions WHERE user_id = ?', [req.user.id]);
    res.setHeader('Set-Cookie', `stylemate_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return res.json({ message: 'Password changed. Sign in again with your new password.' });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const rows = await db.query('SELECT id, email, full_name, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    const user = rows[0];
    return res.json({ user: { ...user, name: user.full_name } });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
