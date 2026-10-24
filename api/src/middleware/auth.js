const crypto = require('crypto');
const db = require('../db/connection');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('stylemate_session='));
  const cookieToken = cookie ? decodeURIComponent(cookie.slice('stylemate_session='.length)) : '';
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const tokenHash = hashToken(token);
    const rows = await db.query(
      `SELECT u.id, u.email, u.role
       FROM auth_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );
    if (!rows.length) return res.status(401).json({ error: 'Session is invalid or expired.' });
    req.user = rows[0];
    req.sessionTokenHash = tokenHash;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return next();
}

function ownershipCheck(paramName = 'userId') {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName] || req.body[paramName];
    if (resourceUserId && resourceUserId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    return next();
  };
}

module.exports = { authenticate, requireAdmin, ownershipCheck, hashToken };
