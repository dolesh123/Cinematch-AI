/**
 * ============================================================================
 * User Preferences Routes (/api/preferences)
 * ============================================================================
 * 
 * Endpoints:
 * - GET /api/preferences : Fetch current user's taste preferences & slider settings
 * - PUT /api/preferences : Update genres, languages, ratings, era, and favorite seeds
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

function getUserFilter(userId) {
  const numericId = Number(userId);
  const key = isNaN(numericId) ? userId : numericId;
  return { user_id: key };
}

// ----------------------------------------------------------------------------
// GET /api/preferences
// ----------------------------------------------------------------------------
router.get('/', authenticateToken, async (req, res) => {
  const db = getDB();
  if (!db) {
    return res.status(500).json({ detail: 'Database unavailable' });
  }

  const userFilter = getUserFilter(req.user.id);
  const pref = await db.collection('user_preferences').findOne(userFilter);

  // Default fallback if preference document not yet created
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

// ----------------------------------------------------------------------------
// PUT /api/preferences
// ----------------------------------------------------------------------------
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

  // 1. Update user preferences
  await db.collection('user_preferences').updateOne(
    getUserFilter(userId),
    { $set: updateData },
    { upsert: true }
  );

  // 2. Record onboarding seed movies as initial LIKE interactions
  if (Array.isArray(favorite_movies)) {
    for (const favId of favorite_movies) {
      const existing = await db.collection('user_interactions').findOne({
        ...getUserFilter(userId),
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

  const pref = await db.collection('user_preferences').findOne(getUserFilter(userId));

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
