/**
 * ============================================================================
 * Authentication Routes (/api/auth)
 * ============================================================================
 * 
 * Endpoints:
 * - POST /api/auth/register : Create new user account & initialize default preferences
 * - POST /api/auth/login    : Verify password & issue JWT bearer token
 * - GET  /api/auth/me       : Fetch current logged-in user profile & state
 * - POST /api/auth/logout   : Update logout timestamp
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { authenticateToken, SECRET_KEY } = require('../middleware/auth');

function createToken(userId, email) {
  return jwt.sign({ sub: String(userId), email }, SECRET_KEY, { expiresIn: '7d' });
}

// ----------------------------------------------------------------------------
// POST /api/auth/register
// ----------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ detail: 'Name, email, and password are required' });
  }

  const db = getDB();
  if (!db) {
    return res.status(500).json({ detail: 'Database unavailable' });
  }

  // 1. Check if user already exists
  const existing = await db.collection('users').findOne({ email });
  if (existing) {
    return res.status(400).json({ detail: 'User with this email already exists' });
  }

  // 2. Generate incremental user ID
  const maxUser = await db.collection('users').find().sort({ id: -1 }).limit(1).toArray();
  const nextId = maxUser.length > 0 ? maxUser[0].id + 1 : 1;

  // 3. Hash password securely
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const newUser = {
    id: nextId,
    name,
    email,
    password_hash,
    is_admin: false,
    created_at: new Date(),
    last_login: new Date(),
  };

  await db.collection('users').insertOne(newUser);

  // 4. Initialize persistent user preferences in MongoDB
  await db.collection('user_preferences').insertOne({
    id: nextId,
    user_id: nextId,
    preferred_genres: [],
    recent_liked_genres: [],
    recent_searches: [],
    preferred_languages: ['English'],
    min_rating: 5.0,
    max_rating: 10.0,
    discovery_slider: 0.5,
    preferred_era: [],
    favorite_movies: [],
    onboarding_completed: false,
    last_active_at: new Date(),
    updated_at: new Date(),
  });

  const token = createToken(nextId, email);

  return res.json({
    access_token: token,
    token_type: 'bearer',
    user_id: nextId,
    name,
    email,
    is_admin: false,
    onboarding_completed: false,
    recent_liked_genres: [],
    recent_searches: [],
  });
});

// ----------------------------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  const db = getDB();
  if (!db) {
    return res.status(500).json({ detail: 'Database unavailable' });
  }

  // 1. Look up user by email
  const user = await db.collection('users').findOne({ email });
  if (!user) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  // 2. Validate password hash
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  // 3. Update last_login timestamp
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { last_login: new Date() } }
  );

  // 4. Fetch onboarding status and recent context
  const pref = await db.collection('user_preferences').findOne({ user_id: user.id });
  const onboarding_completed = pref ? Boolean(pref.onboarding_completed) : false;
  const token = createToken(user.id, user.email);

  return res.json({
    access_token: token,
    token_type: 'bearer',
    user_id: user.id,
    name: user.name,
    email: user.email,
    is_admin: Boolean(user.is_admin),
    onboarding_completed,
    recent_liked_genres: (pref && pref.recent_liked_genres) || [],
    recent_searches: (pref && pref.recent_searches) || [],
    last_login: user.last_login || new Date(),
  });
});

// ----------------------------------------------------------------------------
// GET /api/auth/me
// ----------------------------------------------------------------------------
router.get('/me', authenticateToken, async (req, res) => {
  const db = getDB();
  const pref = db ? await db.collection('user_preferences').findOne({ user_id: req.user.id }) : null;
  const onboarding_completed = pref ? Boolean(pref.onboarding_completed) : false;

  return res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    is_admin: Boolean(req.user.is_admin),
    onboarding_completed,
    recent_liked_genres: (pref && pref.recent_liked_genres) || [],
    recent_searches: (pref && pref.recent_searches) || [],
    created_at: req.user.created_at || new Date(),
    last_login: req.user.last_login || new Date(),
  });
});

// ----------------------------------------------------------------------------
// POST /api/auth/logout
// ----------------------------------------------------------------------------
router.post('/logout', authenticateToken, async (req, res) => {
  const db = getDB();
  if (db && req.user) {
    await db.collection('users').updateOne(
      { id: req.user.id },
      { $set: { last_logout: new Date() } }
    ).catch(() => {});
  }
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
