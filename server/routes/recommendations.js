/**
 * ============================================================================
 * Recommendation Routes (/api/recommendations)
 * ============================================================================
 * 
 * Endpoints:
 * - GET  /api/recommendations         : Dynamic hybrid recommendations based on user history & filter bar
 * - GET  /api/recommendations/unified : Alias for dynamic hybrid recommendations
 * - POST /api/recommendations/mood    : Dynamic recommendations based on natural language prompt
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { getDynamicRecommendations } = require('../services/recommenderEngine');

// ----------------------------------------------------------------------------
// Helper: Record user search query asynchronously
// ----------------------------------------------------------------------------

async function logUserSearch(db, userId, query) {
  if (!db || !query || !query.trim()) return;

  try {
    await db.collection('user_searches').insertOne({
      user_id: userId,
      query: query.trim(),
      timestamp: new Date(),
    });

    const userSearches = await db
      .collection('user_searches')
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .toArray();

    // Maintain 4 recent searches window
    if (userSearches.length > 4) {
      const oldestSearches = userSearches.slice(4);
      const oldestIds = oldestSearches.map((s) => s._id);
      await db.collection('user_searches').deleteMany({
        _id: { $in: oldestIds },
      });
    }

    const latestQueries = userSearches.slice(0, 4).map((s) => s.query);
    await db.collection('user_preferences').updateOne(
      { user_id: userId },
      {
        $set: {
          recent_searches: latestQueries,
          last_active_at: new Date(),
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    // Non-blocking
  }
}

// ----------------------------------------------------------------------------
// GET /api/recommendations & GET /api/recommendations/unified & GET /api/recommendations/cold-start
// ----------------------------------------------------------------------------
router.get(['/', '/unified', '/cold-start'], authenticateToken, async (req, res) => {
  const { genre, language, era, limit = 12 } = req.query;
  const userId = req.user.id;

  try {
    const recs = await getDynamicRecommendations({
      userId,
      limit: Number(limit),
      filterGenre: genre || null,
      filterLanguage: language || null,
      filterEra: era || null,
    });

    // Record recommendation history asynchronously in background
    const db = getDB();
    if (db && Array.isArray(recs) && recs.length > 0) {
      const historyDocs = recs.map((r) => ({
        user_id: userId,
        movie_id: r.id,
        score: r.match_score,
        content_score: r.content_score,
        collaborative_score: r.collaborative_score,
        genre_score: r.genre_score,
        language_score: r.language_score,
        explanation: r.explanation,
        created_at: new Date(),
      }));
      db.collection('recommendation_history').insertMany(historyDocs).catch(() => {});
    }

    return res.json(recs);
  } catch (err) {
    console.error(`[Recommendations Route Error]: ${err.message}`);
    return res.status(500).json({ detail: 'Failed to generate recommendations' });
  }
});

// ----------------------------------------------------------------------------
// POST /api/recommendations/mood
// ----------------------------------------------------------------------------
router.post('/mood', authenticateToken, async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user.id;
  const db = getDB();

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ detail: 'Prompt is required' });
  }

  try {
    // 1. Record search in background
    logUserSearch(db, userId, prompt).catch(() => {});

    // 2. Compute dynamic recommendations based on latest mood & history
    const recs = await getDynamicRecommendations({
      userId,
      limit: 10,
      moodQuery: prompt.trim(),
    });

    return res.json(recs);
  } catch (err) {
    console.error(`[Mood Recommendations Route Error]: ${err.message}`);
    return res.status(500).json({ detail: 'Failed to generate mood recommendations' });
  }
});

module.exports = router;
