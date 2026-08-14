const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/preferences
router.get('/', authenticateToken, async (req, res) => {
  const db = getDB();
  if (!db) {
    return res.status(500).json({ detail: 'Database unavailable' });
  }

  const userId = req.user.id;
  const numericId = Number(userId);
  const userCondition = { $or: [{ user_id: isNaN(numericId) ? userId : numericId }, { user_id: String(userId) }] };

  const pref = await db.collection('user_preferences').findOne(userCondition);
  if (!pref) {
    return res.json({
      id: req.user.id,
      user_id: req.user.id,
      preferred_genres: [],
      preferred_languages: ['English'],
      min_rating: 5.0,
      max_rating: 10.0,
      discovery_slider: 0.5,
      preferred_era: [],
      favorite_movies: [],
      onboarding_completed: false,
    });
  }

  return res.json({
    id: pref.id || pref.user_id,
    user_id: pref.user_id,
    preferred_genres: pref.preferred_genres || [],
    preferred_languages: pref.preferred_languages || [],
    min_rating: Number(pref.min_rating || 5.0),
    max_rating: Number(pref.max_rating || 10.0),
    discovery_slider: Number(pref.discovery_slider || 0.5),
    preferred_era: pref.preferred_era || [],
    favorite_movies: pref.favorite_movies || [],
    onboarding_completed: Boolean(pref.onboarding_completed),
  });
});

// PUT /api/preferences
router.put('/', authenticateToken, async (req, res) => {
  const db = getDB();
  if (!db) {
    return res.status(500).json({ detail: 'Database unavailable' });
  }

  const userId = req.user.id;
  const numericId = Number(userId);
  const userKey = isNaN(numericId) ? userId : numericId;

  const {
    preferred_genres = [],
    preferred_languages = ['English'],
    min_rating = 5.0,
    max_rating = 10.0,
    discovery_slider = 0.5,
    preferred_era = [],
    favorite_movies = [],
    onboarding_completed = true,
  } = req.body;

  const updateData = {
    user_id: userKey,
    preferred_genres,
    preferred_languages,
    min_rating: Number(min_rating),
    max_rating: Number(max_rating),
    discovery_slider: Number(discovery_slider),
    preferred_era,
    favorite_movies,
    onboarding_completed: Boolean(onboarding_completed),
    updated_at: new Date(),
  };

  await db.collection('user_preferences').updateOne(
    { $or: [{ user_id: userKey }, { user_id: String(userKey) }] },
    { $set: updateData },
    { upsert: true }
  );

  // Record onboarding seed interactions
  if (Array.isArray(favorite_movies)) {
    for (const favId of favorite_movies) {
      const existing = await db.collection('user_interactions').findOne({
        $or: [{ user_id: userKey }, { user_id: String(userKey) }],
        movie_id: Number(favId),
        interaction_type: 'LIKE',
      });
      if (!existing) {
        await db.collection('user_interactions').insertOne({
          user_id: userKey,
          movie_id: Number(favId),
          interaction_type: 'LIKE',
          weight: 1.0,
          timestamp: new Date(),
        });
      }
    }
  }

  const pref = await db.collection('user_preferences').findOne({
    $or: [{ user_id: userKey }, { user_id: String(userKey) }],
  });

  return res.json({
    id: pref.id || pref.user_id,
    user_id: pref.user_id,
    preferred_genres: pref.preferred_genres || [],
    preferred_languages: pref.preferred_languages || [],
    min_rating: Number(pref.min_rating || 5.0),
    max_rating: Number(pref.max_rating || 10.0),
    discovery_slider: Number(pref.discovery_slider || 0.5),
    preferred_era: pref.preferred_era || [],
    favorite_movies: pref.favorite_movies || [],
    onboarding_completed: Boolean(pref.onboarding_completed),
  });
});

module.exports = router;
