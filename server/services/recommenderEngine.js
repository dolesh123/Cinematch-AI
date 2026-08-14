const { getDB, getCachedMovies, getCachedMovieById, getMovieImages } = require('../db');

const NEGATION_PATTERNS = [
  /\b(?:don't|dont|do not|no|without|avoid|except|hate|dislike|not interested in|never|exclude)\s+([a-zA-Z\s-]+?)(?:movies?|films?|$|,|\.)/i,
  /\b(?:no|not)\s+([a-zA-Z\s-]+?)(?:movies?|films?|$|,|\.)/i,
];

const GENRE_SYNONYMS = {
  action: 'Action',
  adventure: 'Adventure',
  animation: 'Animation',
  animated: 'Animation',
  anime: 'Animation',
  comedy: 'Comedy',
  funny: 'Comedy',
  crime: 'Crime',
  gangster: 'Crime',
  documentary: 'Documentary',
  drama: 'Drama',
  dramatic: 'Drama',
  family: 'Family',
  kids: 'Family',
  fantasy: 'Fantasy',
  history: 'History',
  historical: 'History',
  horror: 'Horror',
  scary: 'Horror',
  spooky: 'Horror',
  haunted: 'Horror',
  music: 'Music',
  musical: 'Music',
  mystery: 'Mystery',
  detective: 'Mystery',
  romance: 'Romance',
  romantic: 'Romance',
  romcom: 'Romance',
  'sci-fi': 'Science Fiction',
  scifi: 'Science Fiction',
  'science fiction': 'Science Fiction',
  thriller: 'Thriller',
  suspense: 'Thriller',
  war: 'War',
  western: 'Western',
};

function parseNegation(queryStr) {
  if (!queryStr) return [];
  const text = queryStr.toLowerCase();
  const negatedGenres = [];

  for (const pattern of NEGATION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const phrase = match[1].trim();
      for (const [key, canonical] of Object.entries(GENRE_SYNONYMS)) {
        if (phrase.includes(key)) {
          if (!negatedGenres.includes(canonical)) {
            negatedGenres.push(canonical);
          }
        }
      }
    }
  }

  return negatedGenres;
}

function extractKeywords(queryStr) {
  if (!queryStr) return [];
  const stopWords = new Set([
    'i', 'want', 'to', 'watch', 'a', 'the', 'and', 'in', 'with', 'for',
    'of', 'is', 'me', 'some', 'give', 'movies', 'movie', 'film', 'films',
    'show', 'recommend', 'like', 'about', 'need', 'would', 'dont', "don't"
  ]);

  const words = queryStr.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  return words.filter((w) => w.length > 2 && !stopWords.has(w));
}

async function getDynamicRecommendations({
  userId,
  limit = 12,
  moodQuery = null,
  filterGenre = null,
  filterLanguage = null,
  filterEra = null,
}) {
  const db = getDB();
  if (!db) return [];

  const numericId = Number(userId);
  const userQueryId = isNaN(numericId) ? String(userId) : numericId;
  const userCondition = { $or: [{ user_id: userQueryId }, { user_id: String(userId) }] };

  // 1. Fetch user's profile and preferences (strictly isolated)
  const pref = await db.collection('user_preferences').findOne(userCondition);

  const preferredGenres = (pref && Array.isArray(pref.preferred_genres)) ? pref.preferred_genres : [];
  const preferredLanguages = (pref && pref.preferred_languages) || ['English'];
  const minRating = (pref && Number(pref.min_rating)) || 5.0;

  // 2. Fetch user's latest 2-3 likes (strictly isolated to this user)
  const recentLikes = await db
    .collection('user_interactions')
    .find({ ...userCondition, interaction_type: 'LIKE' })
    .sort({ timestamp: -1 })
    .limit(3)
    .toArray();

  const likedMovieIds = recentLikes.map((l) => l.movie_id);
  const likedMovies = likedMovieIds.length > 0
    ? (await Promise.all(likedMovieIds.map((id) => getCachedMovieById(id)))).filter(Boolean)
    : [];

  const likedGenres = new Set();
  const likedDirectors = new Set();
  const likedKeywords = new Set();
  likedMovies.forEach((m) => {
    (m.genres || []).forEach((g) => likedGenres.add(g));
    if (m.director) likedDirectors.add(m.director.toLowerCase());
    (m.keywords || []).forEach((k) => likedKeywords.add(k.toLowerCase()));
  });

  const effectiveGenres = likedGenres.size > 0 ? Array.from(likedGenres) : preferredGenres;
  const isNewUserWithoutHistory = likedMovieIds.length === 0;

  // 3. Fetch user's historical searches (strictly isolated to this user)
  const recentSearches = await db
    .collection('user_searches')
    .find(userCondition)
    .sort({ timestamp: -1 })
    .limit(3)
    .toArray();

  const pastSearchKeywords = new Set();
  const searchNegatedGenres = new Set();

  recentSearches.forEach((s) => {
    const neg = parseNegation(s.query);
    neg.forEach((g) => searchNegatedGenres.add(g));
    extractKeywords(s.query).forEach((w) => pastSearchKeywords.add(w));
  });

  // Active query parameters (Top Priority when provided)
  const activeKeywords = new Set();
  const activeTargetGenres = new Set();
  let hasActiveSearch = false;

  if (moodQuery && moodQuery.trim()) {
    hasActiveSearch = true;
    const neg = parseNegation(moodQuery);
    neg.forEach((g) => searchNegatedGenres.add(g));
    const kws = extractKeywords(moodQuery);
    kws.forEach((w) => {
      activeKeywords.add(w);
      if (GENRE_SYNONYMS[w]) activeTargetGenres.add(GENRE_SYNONYMS[w]);
    });
  }

  // 4. Fetch disliked movie IDs to exclude
  const dislikedInteractions = await db
    .collection('user_interactions')
    .find({ ...userCondition, interaction_type: { $in: ['DISLIKE', 'NOT_INTERESTED'] } })
    .toArray();
  const dislikedIds = new Set(dislikedInteractions.map((i) => i.movie_id));

  // 5. Fetch all movie candidates instantly from memory cache
  const allMovies = await getCachedMovies();

  const scoredCandidates = [];

  for (const movie of allMovies) {
    if (dislikedIds.has(movie.id)) continue;

    const movieGenres = Array.isArray(movie.genres) ? movie.genres : [];
    const movieDirector = (movie.director || '').toLowerCase();
    const movieTitle = (movie.title || '').toLowerCase();
    const movieCast = Array.isArray(movie.cast_members) ? movie.cast_members.map((c) => c.toLowerCase()) : [];
    const movieKeywords = Array.isArray(movie.keywords) ? movie.keywords.map((k) => k.toLowerCase()) : [];
    const movieOverview = (movie.overview || '').toLowerCase();

    // STRICT NEGATION FILTER
    const isNegated = movieGenres.some((g) => searchNegatedGenres.has(g));
    if (isNegated) {
      continue; // 100% excluded
    }

    // FILTER: Genre, Language, Era if explicitly selected in filter bar
    if (filterGenre && !movieGenres.some((g) => g.toLowerCase() === filterGenre.toLowerCase())) {
      continue;
    }
    if (filterLanguage && movie.language && movie.language.toLowerCase() !== filterLanguage.toLowerCase()) {
      continue;
    }
    if (filterEra) {
      const y = movie.year || 2000;
      if (filterEra === '2020+' && y < 2020) continue;
      if (filterEra === '2010-2020' && (y < 2010 || y > 2020)) continue;
      if (filterEra === '2000-2010' && (y < 2000 || y > 2010)) continue;
      if (filterEra === '1980-2000' && (y < 1980 || y > 2000)) continue;
    }

    let score = 40.0;
    let matchReason = '';
    const details = {
      'Active Search Priority': hasActiveSearch ? 0 : 50.0,
      'Recent Likes Alignment': 0.0,
      'Genre Compatibility': 40.0,
      'Rating Quality': 60.0,
    };

    // ==========================================
    // 🌟 1. TOP PRIORITY: ACTIVE SEARCH QUERY
    // ==========================================
    if (hasActiveSearch) {
      const queryStr = moodQuery.trim().toLowerCase();
      let activeHits = 0;
      let matchedTerm = '';

      if (movieTitle === queryStr) {
        activeHits += 800; // Exact title match
        matchedTerm = movie.title;
      } else if (movieTitle.startsWith(queryStr)) {
        activeHits += 600;
        matchedTerm = movie.title;
      } else if (movieTitle.includes(queryStr)) {
        activeHits += 450;
        matchedTerm = queryStr;
      }

      if (movieDirector === queryStr) {
        activeHits += 500;
        matchedTerm = movie.director;
      } else if (movieDirector.includes(queryStr)) {
        activeHits += 350;
        matchedTerm = movie.director;
      }

      for (const kw of activeKeywords) {
        if (movieTitle.includes(kw)) {
          activeHits += 200;
          matchedTerm = kw;
        } else if (movieDirector.includes(kw)) {
          activeHits += 150;
          matchedTerm = movie.director;
        } else if (movieCast.some((c) => c.includes(kw))) {
          activeHits += 120;
          matchedTerm = kw;
        } else if (movieGenres.some((g) => g.toLowerCase().includes(kw))) {
          activeHits += 100;
          matchedTerm = kw;
        } else if (movieKeywords.some((k) => k.includes(kw))) {
          activeHits += 60;
          matchedTerm = kw;
        } else if (movieOverview.includes(kw)) {
          activeHits += 30;
        }
      }

      for (const tg of activeTargetGenres) {
        if (movieGenres.includes(tg)) {
          activeHits += 150;
          matchedTerm = tg;
        }
      }

      if (activeHits > 0) {
        score += activeHits;
        details['Active Search Priority'] = Math.min(100, 50 + activeHits / 10);
        if (movieDirector && movieDirector.includes(matchedTerm.toLowerCase())) {
          matchReason = `🎬 Directed by ${movie.director} matching your search`;
        } else if (matchedTerm) {
          matchReason = `🔍 Matches your search for '${matchedTerm}'`;
        }
      } else {
        score -= 50;
      }
    }

    // ==========================================
    // 2. RECENT LIKES BOOST (Only if user has liked movies)
    // ==========================================
    if (likedMovieIds.length > 0) {
      let likesOverlap = 0;
      const distinctiveGenres = ['Romance', 'Horror', 'Animation', 'Science Fiction', 'Comedy', 'Fantasy'];

      movieGenres.forEach((g) => {
        if (likedGenres.has(g)) {
          likesOverlap += distinctiveGenres.includes(g) ? 25 : 15;
        }
      });
      if (likedDirectors.has(movieDirector)) likesOverlap += 30;
      movieKeywords.forEach((k) => {
        if (likedKeywords.has(k)) likesOverlap += 10;
      });

      score += hasActiveSearch ? Math.min(15, likesOverlap * 0.3) : Math.min(45, likesOverlap);
      details['Recent Likes Alignment'] = Math.min(100, 40 + likesOverlap);

      if (!hasActiveSearch && likesOverlap >= 20 && !matchReason) {
        const topLikedTitle = likedMovies[0] ? likedMovies[0].title : 'recent favorites';
        matchReason = `❤️ Recommended based on your recent like for '${topLikedTitle}'`;
      }
    }

    // ==========================================
    // 3. GENRE FIT
    // ==========================================
    let genreFit = 0;
    const distinctiveGenresList = ['Romance', 'Horror', 'Animation', 'Science Fiction', 'Comedy', 'Fantasy'];
    effectiveGenres.forEach((g) => {
      if (movieGenres.includes(g)) {
        genreFit += distinctiveGenresList.includes(g) ? 25 : 15;
      }
    });
    score += hasActiveSearch ? Math.min(10, genreFit * 0.2) : Math.min(30, genreFit);
    details['Genre Compatibility'] = Math.min(100, 30 + genreFit * 2);

    // ==========================================
    // 4. RATING & POPULARITY
    // ==========================================
    const ratingNorm = (Number(movie.rating) || 7.0) * 1.5;
    score += Math.min(10, ratingNorm);
    details['Rating Quality'] = Math.min(100, (Number(movie.rating) || 7.0) * 10);

    // Specific explanation fallback for brand new user with 0 likes
    if (!matchReason) {
      if (searchNegatedGenres.size > 0) {
        const excludedStr = Array.from(searchNegatedGenres).join(', ');
        matchReason = `🛡️ Excluded ${excludedStr} movies based on your query & ranked top alternatives`;
      } else if (effectiveGenres.length > 0) {
        matchReason = `✨ Tailored to your active genre preferences (${effectiveGenres.slice(0, 2).join(', ')})`;
      } else if (isNewUserWithoutHistory) {
        matchReason = `🌟 Welcome to CineMatch! Acclaimed title to kickstart your taste profile`;
      } else {
        matchReason = `🌟 Highly rated title matching your taste profile`;
      }
    }

    const rawScore = score;
    const finalScore = Math.min(99.0, Math.max(50.0, Math.round((Math.min(100, score > 100 ? 90 + score / 50 : score)) * 10) / 10));

    const mId = Number(movie.id);
    const [defaultPoster, defaultBackdrop] = getMovieImages(mId, movie.title, movieGenres);

    scoredCandidates.push({
      id: mId,
      title: movie.title,
      year: Number(movie.year || 2000),
      genres: movieGenres,
      language: movie.language || 'English',
      rating: Number(movie.rating || 7.0),
      vote_count: Number(movie.vote_count || 100),
      overview: movie.overview || '',
      poster_path: movie.poster_path && movie.poster_path.startsWith('http') ? movie.poster_path : defaultPoster,
      backdrop_path: movie.backdrop_path && movie.backdrop_path.startsWith('http') ? movie.backdrop_path : defaultBackdrop,
      director: movie.director || 'Unknown',
      cast_members: movieCast,
      keywords: movieKeywords,
      popularity: Number(movie.popularity || 10.0),
      emotional_vibes: Array.isArray(movie.emotional_vibes) ? movie.emotional_vibes : [],
      match_score: finalScore,
      _rawScore: rawScore,
      content_score: details['Recent Likes Alignment'] / 100,
      collaborative_score: details['Active Search Priority'] / 100,
      genre_score: details['Genre Compatibility'] / 100,
      language_score: 0.9,
      explanation: matchReason,
      explanation_details: details,
    });
  }

  // Sort strictly descending by raw score
  scoredCandidates.sort((a, b) => b._rawScore - a._rawScore || b.rating - a.rating);

  return scoredCandidates.slice(0, limit);
}

module.exports = {
  getDynamicRecommendations,
  parseNegation,
};
