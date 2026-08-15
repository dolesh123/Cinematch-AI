const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

const SECRET_KEY = process.env.SECRET_KEY || 'cinematch_super_secret_jwt_key_2026_cognizant_hackathon';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Could not validate credentials or token missing' });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const userId = parseInt(payload.sub, 10);

    const db = getDB();
    if (db) {
      const user = await db.collection('users').findOne({
        $or: [{ id: userId }, { id: String(payload.sub) }, { email: payload.email }]
      });
      if (user) {
        req.user = user;
      } else {
        req.user = { id: userId || 1, email: payload.email || 'user@cinematch.ai', name: 'User', is_admin: false };
      }
    } else {
      // Offline fallback user
      req.user = { id: userId || 1, email: payload.email || 'user@cinematch.ai', name: 'User', is_admin: false };
    }

    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ detail: 'Admin privileges required for this endpoint' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  SECRET_KEY,
};
