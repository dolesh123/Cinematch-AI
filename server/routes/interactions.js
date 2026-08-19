/**
 * ============================================================================
 * User Interactions & Watchlist Routes (/api)
 * ============================================================================
 * 
 * Endpoints:
 * - POST   /api/feedback       : Record Likes, Dislikes, Ratings with 4-item sliding window
 * - GET    /api/watchlist      : Retrieve user's saved watchlist
 * - POST   /api/watchlist      : Toggle movie in/out of watchlist
 * - DELETE /api/watchlist/:id  : Remove movie from watchlist
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { formatMovie } = require('./movies');

const INTERACTION_WEIGHTS = {
  LIKE: 1.0,
  DISLIKE: -1.0,
  RATING: 1.0,
  WATCHLIST: 0.5,
  CLICK: 0.2,
  VIEW_DETAILS: 0.3,
  NOT_INTERESTED: -0.8,
};

// ----------------------------------------------------------------------------
// Helper: Maintain Sliding Window for Likes & Sync Preferences
// ----------------------------------------------------------------------------

async function maintainLikesSlidingWindow(db, userId) {
  const userLikes = await db
    .collection('user_interactions')
    .find({ user_id: userId, interaction_type: 'LIKE' })
    .sort({ timestamp: -1 })
    .toArray();

  // Keep latest 4 likes, prune older ones
  if (userLikes.length > 4) {
    const oldestLikes = userLikes.slice(4);
    const oldestIds = oldestLikes.map((l) => l._id);
    await db.collection('user_interactions').deleteMany({
      _id: { $in: oldestIds },
    });
  }

  // Update user preferences based on latest 3 liked movies
  const recentLikes = userLikes.slice(0, 3);
  const recentMovieIds = recentLikes.map((l) => l.movie_id);

  const recentMovies = await db
    .collection('movies')
    .find({ id: { $in: recentMovieIds } })
    .toArray();

  const recentGenresSet = new Set();
  recentMovies.forEach((m) => {
    if (Array.isArray(m.genres)) {
      m.genres.forEach((g) => recentGenresSet.add(g));
    }
  });

  const updatedGenres = Array.from(recentGenresSet);
  if (updatedGenres.length > 0) {
    await db.collection('user_preferences').updateOne(
      { user_id: userId },
      {
        $set: {
          preferred_genres: updatedGenres,
          recent_liked_genres: updatedGenres,
          last_liked_movie_ids: recentMovieIds,
          last_active_at: new Date(),
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );
  }
}

// ----------------------------------------------------------------------------
// POST /api/feedback
// ----------------------------------------------------------------------------
router.post('/feedback', authenticateToken, async (req, res) => {
  const { movie_id, interaction_type, rating_value } = req.body;
  const userId = req.user.id;
  const db = getDB();

  if (!db) {
    return res.status(500).json({ detail: 'Database unavailable' });
  }

  const weight = INTERACTION_WEIGHTS[interaction_type] || 0.5;

  // 1. Record interaction event
  await db.collection('user_interactions').insertOne({
    user_id: userId,
    movie_id: Number(movie_id),
    interaction_type,
    weight,
    timestamp: new Date(),
  });

  // 2. If numerical rating provided, upsert rating collection
  if (interaction_type === 'RATING' && rating_value !== undefined) {
    await db.collection('ratings').updateOne(
      { user_id: userId, movie_id: Number(movie_id) },
      { $set: { rating: Number(rating_value), created_at: new Date() } },
      { upsert: true }
    );
  }

  // 3. For LIKE interactions, maintain sliding window & update preferred genres
  if (interaction_type === 'LIKE') {
    await maintainLikesSlidingWindow(db, userId);
  }

  return res.json({ message: `Recorded feedback '${interaction_type}' for movie ID ${movie_id}` });
});

// ----------------------------------------------------------------------------
// GET /api/watchlist
// ----------------------------------------------------------------------------
router.get('/watchlist', authenticateToken, async (req, res) => {
  const db = getDB();
  if (!db) {
    return res.json([]);
  }

  const items = await db.collection('watchlists').find({ user_id: req.user.id }).toArray();
  const movieIds = items.map((it) => it.movie_id);

  const movies = await db.collection('movies').find({ id: { $in: movieIds } }).toArray();
  return res.json(movies.map(formatMovie));
});

// ----------------------------------------------------------------------------
// POST /api/watchlist
// ----------------------------------------------------------------------------
router.post('/watchlist', authenticateToken, async (req, res) => {
  const { movie_id } = req.body;
  const userId = req.user.id;
  const db = getDB();

  if (!db) {
    return res.status(500).json({ detail: 'Database unavailable' });
  }

  const existing = await db.collection('watchlists').findOne({
    user_id: userId,
    movie_id: Number(movie_id),
  });

  if (existing) {
    // Toggle remove from watchlist
    await db.collection('watchlists').deleteOne({ _id: existing._id });
    return res.json({ in_watchlist: false, message: 'Removed from watchlist' });
  } else {
    // Toggle add to watchlist
    await db.collection('watchlists').insertOne({
      user_id: userId,
      movie_id: Number(movie_id),
      is_watched: false,
      added_at: new Date(),
    });
    await db.collection('user_interactions').insertOne({
      user_id: userId,
      movie_id: Number(movie_id),
      interaction_type: 'WATCHLIST',
      weight: 0.5,
      timestamp: new Date(),
    });
    return res.json({ in_watchlist: true, message: 'Added to watchlist' });
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/watchlist/:id
// ----------------------------------------------------------------------------
router.delete('/watchlist/:id', authenticateToken, async (req, res) => {
  const movieId = parseInt(req.params.id, 10);
  const db = getDB();

  if (db) {
    await db.collection('watchlists').deleteMany({
      user_id: req.user.id,
      movie_id: movieId,
    });
  }

  return res.json({ message: 'Removed from watchlist' });
});

module.exports = router;
