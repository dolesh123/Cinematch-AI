const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getDB, getCachedMovies, getCachedMovieById, getMovieImages } = require('../db');
const { getMoviePoster } = require('../services/posterResolver');
const { SECRET_KEY } = require('../middleware/auth');

function formatMovie(m) {
  const mId = Number(m.id || m._id);
  const mTitle = m.title || '';
  const mYear = Number(m.year || 2000);
  const mGenres = Array.isArray(m.genres) ? m.genres : [];
  const mDirector = m.director || 'Unknown';

  let posterUrl = '';

  // 1. Check if movie already has an authentic valid image URL
  if (m.poster_path && typeof m.poster_path === 'string' && m.poster_path.startsWith('http') && !m.poster_path.includes('data:image/svg')) {
    posterUrl = m.poster_path;
  } else if (m.poster_path && typeof m.poster_path === 'string' && m.poster_path.startsWith('/')) {
    posterUrl = `https://image.tmdb.org/t/p/w500${m.poster_path}`;
  }

  // 2. Use authentic poster resolver
  const resolved = getMoviePoster(mTitle, mYear, mGenres, mDirector);
  if (resolved && resolved.startsWith('http') && (!posterUrl || posterUrl.includes('unsplash'))) {
    posterUrl = resolved;
  } else if (!posterUrl) {
    posterUrl = resolved;
  }

  // Backdrop resolution
  let backdropUrl = '';
  if (m.backdrop_path && typeof m.backdrop_path === 'string' && m.backdrop_path.startsWith('http')) {
    backdropUrl = m.backdrop_path;
  } else if (m.backdrop_path && typeof m.backdrop_path === 'string' && m.backdrop_path.startsWith('/')) {
    backdropUrl = `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`;
  } else {
    backdropUrl = posterUrl;
  }

  return {
    id: mId,
    title: mTitle,
    year: mYear,
    genres: mGenres,
    language: m.language || 'English',
    rating: Number(m.rating || 7.0),
    vote_count: Number(m.vote_count || 100),
    overview: m.overview || '',
    poster_path: posterUrl,
    backdrop_path: backdropUrl,
    director: mDirector,
    cast_members: Array.isArray(m.cast_members) ? m.cast_members : [],
    keywords: Array.isArray(m.keywords) ? m.keywords : [],
    popularity: Number(m.popularity || 10.0),
    emotional_vibes: Array.isArray(m.emotional_vibes) ? m.emotional_vibes : [],
  };
}

// Background search history tracker
function trackUserSearch(token, query) {
  if (!token || !query || !query.trim()) return;
  const db = getDB();
  if (!db) return;

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const userId = parseInt(payload.sub, 10);
    if (isNaN(userId)) return;

    (async () => {
      await db.collection('user_searches').insertOne({
        user_id: userId,
        query: query.trim(),
        timestamp: new Date(),
      }).catch(() => {});

      const userSearches = await db
        .collection('user_searches')
        .find({ user_id: userId })
        .sort({ timestamp: -1 })
        .toArray()
        .catch(() => []);

      if (userSearches.length > 4) {
        const oldestSearches = userSearches.slice(4);
        const oldestIds = oldestSearches.map((s) => s._id);
        await db.collection('user_searches').deleteMany({
          _id: { $in: oldestIds },
        }).catch(() => {});
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
      ).catch(() => {});
    })().catch(() => {});
  } catch (e) {}
}

// GET /api/movies/search
router.get('/search', async (req, res) => {
  const { q, genre, language, limit = 20 } = req.query;

  // Track search query asynchronously in the background
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token && q && q.trim()) {
    trackUserSearch(token, q);
  }

  try {
    const allMovies = await getCachedMovies();
    let results = allMovies;

    if (genre) {
      const target = genre.toLowerCase().replace(/[^a-z0-9]/g, '');
      results = results.filter((m) =>
        (m.genres || []).some((g) => {
          const gNorm = g.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (gNorm === target) return true;
          if ((target.includes('scifi') || target.includes('sciencefiction')) &&
              (gNorm.includes('scifi') || gNorm.includes('sciencefiction'))) {
            return true;
          }
          return g.toLowerCase().includes(genre.toLowerCase()) || genre.toLowerCase().includes(g.toLowerCase());
        })
      );
    }

    if (language) {
      results = results.filter((m) =>
        m.language && m.language.toLowerCase() === language.toLowerCase()
      );
    }

    if (q && q.trim()) {
      const query = q.trim().toLowerCase();
      const queryTokens = query.split(/\s+/).filter((t) => t.length > 1);

      const scored = [];
      for (const m of results) {
        const title = (m.title || '').toLowerCase();
        const director = (m.director || '').toLowerCase();
        const cast = (m.cast_members || []).map((c) => c.toLowerCase());
        const genres = (m.genres || []).map((g) => g.toLowerCase());
        const keywords = (m.keywords || []).map((k) => k.toLowerCase());
        const overview = (m.overview || '').toLowerCase();

        let relScore = 0;

        // TOP PRIORITY: Search Relevance
        if (title === query) {
          relScore += 1000; // Exact title match
        } else if (title.startsWith(query)) {
          relScore += 700; // Title starts with query
        } else if (title.includes(query)) {
          relScore += 500; // Title contains full query
        }

        if (director === query) {
          relScore += 600; // Exact director match
        } else if (director.includes(query)) {
          relScore += 450;
        }

        if (cast.some((c) => c === query)) {
          relScore += 400; // Exact cast match
        } else if (cast.some((c) => c.includes(query))) {
          relScore += 300;
        }

        if (genres.some((g) => g === query || g.includes(query))) {
          relScore += 350; // Genre match
        }

        if (keywords.some((k) => k.includes(query))) {
          relScore += 250;
        }

        // Token-level matching
        for (const tok of queryTokens) {
          if (title.includes(tok)) relScore += 150;
          if (director.includes(tok)) relScore += 100;
          if (cast.some((c) => c.includes(tok))) relScore += 80;
          if (genres.some((g) => g.includes(tok))) relScore += 80;
          if (keywords.some((k) => k.includes(tok))) relScore += 50;
          if (overview.includes(tok)) relScore += 20;
        }

        if (relScore > 0) {
          // Add subtle tie breaker for rating & popularity
          relScore += (Number(m.rating) || 7.0) * 2 + Math.min(20, (Number(m.popularity) || 10) / 10);
          scored.push({ movie: m, relScore });
        }
      }

      // Sort strictly descending by search relevance score
      scored.sort((a, b) => b.relScore - a.relScore);
      results = scored.map((s) => s.movie);
    }

    return res.json(results.slice(0, Number(limit)).map(formatMovie));
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  const movieId = parseInt(req.params.id, 10);
  try {
    const movie = await getCachedMovieById(movieId);
    if (!movie) {
      return res.status(404).json({ detail: 'Movie not found' });
    }
    return res.json(formatMovie(movie));
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
