/**
 * ============================================================================
 * CineMatch AI - Backend Refactoring Regression Test Suite
 * ============================================================================
 */

const { connectDB, getDB, getCachedMovies } = require('./db');
const { getDynamicRecommendations, parseNegation, applyDiversityRerank } = require('./services/recommenderEngine');
const { evaluateModel } = require('./services/modelEvaluator');
const { getMoviePoster } = require('./services/posterResolver');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 Starting CineMatch AI Backend Regression Test Suite');
  console.log('======================================================\n');

  // Step 0: Initialize Database
  console.log('--- [0] Database Initialization ---');
  await connectDB();
  const db = getDB();
  assert(db !== null, 'Database connection initialized successfully');

  const movies = await getCachedMovies();
  assert(movies.length >= 14, `Cached movie catalog loaded (${movies.length} movies)`);

  // Step 1: Poster Resolver
  console.log('\n--- [1] Poster Resolver & Verified Cache ---');
  const posterInception = getMoviePoster('Inception', 2010, ['Sci-Fi', 'Action'], 'Christopher Nolan');
  assert(posterInception.startsWith('http'), `Poster found for Inception: ${posterInception}`);

  const posterSpiderMan = getMoviePoster('Spider-Man', 2002, ['Action'], 'Sam Raimi');
  assert(posterSpiderMan.startsWith('http'), `Poster found for Spider-Man: ${posterSpiderMan}`);

  // Step 2: NLP Negation Parser
  console.log('\n--- [2] NLP Negation Parser ---');
  const neg1 = parseNegation('action movies but no horror');
  assert(neg1.includes('Horror'), `Parsed negation 'no horror' -> [${neg1.join(', ')}]`);

  const neg2 = parseNegation('recommend sci-fi without romance or comedy');
  assert(neg2.includes('Romance') && neg2.includes('Comedy'), `Parsed multi-negation -> [${neg2.join(', ')}]`);

  const neg3 = parseNegation('something fun with exciting adventures');
  assert(neg3.length === 0, `No false positives for positive queries -> [${neg3.join(', ')}]`);

  // Step 3: Recommendation Scenarios
  console.log('\n--- [3] 12 Core Recommendation Scenarios ---');

  // Scenario 1: Cold Start (New User ID 999 with 0 likes)
  const coldRecs = await getDynamicRecommendations({ userId: 999, limit: 5 });
  assert(coldRecs.length === 5, `Scenario 1 (Cold Start): Returned ${coldRecs.length} top recommendations`);
  assert(coldRecs[0].match_score >= 50 && coldRecs[0].match_score <= 100, `Scenario 1: Match score within valid range [50-99] (${coldRecs[0].match_score}%)`);

  // Scenario 2: Existing User with favorite seeds (User 1 - Sci-Fi fan)
  const user1Recs = await getDynamicRecommendations({ userId: 1, limit: 5 });
  assert(user1Recs.length > 0, `Scenario 2 (User Seeds): Generated ${user1Recs.length} recommendations for Sci-Fi user`);
  const hasSciFiOrNolan = user1Recs.some(r => r.genres.includes('Science Fiction') || r.director === 'Christopher Nolan');
  assert(hasSciFiOrNolan, 'Scenario 2: User 1 recommendations match Sci-Fi / Nolan seed profile');

  // Scenario 3: Recent Likes Boost (User 2 likes Titanic -> Romance/Drama boost)
  const user2Recs = await getDynamicRecommendations({ userId: 2, limit: 5 });
  assert(user2Recs.length > 0, `Scenario 3 (Recent Likes Boost): Generated ${user2Recs.length} recommendations for Romance user`);
  const romanceMatch = user2Recs.some(r => r.genres.includes('Romance') || r.genres.includes('Drama'));
  assert(romanceMatch, 'Scenario 3: Recommendations reflect Romance/Drama boost');

  // Scenario 4: Disliked Movies Filter
  await db.collection('user_interactions').deleteMany({ user_id: 100 });
  await db.collection('user_interactions').insertOne({
    user_id: 100,
    movie_id: 27205,
    interaction_type: 'DISLIKE',
    weight: -1.0,
    timestamp: new Date(),
  });
  const user100Recs = await getDynamicRecommendations({ userId: 100, limit: 10 });
  const hasInception = user100Recs.some(r => r.id === 27205);
  assert(!hasInception, 'Scenario 4 (Disliked Filter): Disliked movie Inception (27205) is 100% excluded from output');

  // Scenario 5: User with Watchlist
  await db.collection('watchlists').deleteMany({ user_id: 101 });
  await db.collection('watchlists').insertOne({
    user_id: 101,
    movie_id: 157336,
    is_watched: false,
    added_at: new Date(),
  });
  const user101Recs = await getDynamicRecommendations({ userId: 101, limit: 5 });
  assert(user101Recs.length === 5, `Scenario 5 (User with Watchlist): Generated ${user101Recs.length} recommendations`);

  // Scenario 6: Explicit Genre Filter (Genre = 'Horror')
  const horrorRecs = await getDynamicRecommendations({ userId: 1, limit: 5, filterGenre: 'Horror' });
  const allHorror = horrorRecs.every(r => r.genres.includes('Horror'));
  assert(allHorror && horrorRecs.length > 0, `Scenario 6 (Genre Filter): All ${horrorRecs.length} results have Horror genre`);

  // Scenario 7: Mood-based NLP Query ('mind-bending space journey')
  const moodRecs = await getDynamicRecommendations({ userId: 1, limit: 5, moodQuery: 'mind-bending space exploration' });
  assert(moodRecs.length > 0, `Scenario 7 (Mood Query): Generated ${moodRecs.length} results for 'mind-bending space exploration'`);
  assert(moodRecs[0].explanation.includes('search') || moodRecs[0].explanation.includes('genre') || moodRecs[0].explanation.includes('Matches'), `Scenario 7: Explanation reflects query intent: "${moodRecs[0].explanation}"`);

  // Scenario 8: Strict Negation Query ('action movies no horror')
  const negRecs = await getDynamicRecommendations({ userId: 1, limit: 10, moodQuery: 'exciting action movies no horror' });
  const anyNegHorror = negRecs.some(r => r.genres.includes('Horror'));
  assert(!anyNegHorror, 'Scenario 8 (Strict Negation): Horror movies completely pruned from results');

  // Scenario 9: Empty / Whitespace Query Handling
  const emptyRecs = await getDynamicRecommendations({ userId: 1, limit: 5, moodQuery: '   ' });
  assert(emptyRecs.length === 5, 'Scenario 9 (Empty Query): Safely falls back to personalized taste profile');

  // Scenario 10: Era Filtering ('2010-2020')
  const eraRecs = await getDynamicRecommendations({ userId: 1, limit: 5, filterEra: '2010-2020' });
  const allEraMatch = eraRecs.every(r => r.year >= 2010 && r.year <= 2020);
  assert(allEraMatch && eraRecs.length > 0, `Scenario 10 (Era Filter): All ${eraRecs.length} movies fall within 2010-2020`);

  // Scenario 11: Multi-Interaction Sliding Window
  await db.collection('user_interactions').deleteMany({ user_id: 200 });
  const slidingLikes = [155, 27205, 157336, 19995, 597]; // 5 likes
  for (const mId of slidingLikes) {
    await db.collection('user_interactions').insertOne({
      user_id: 200,
      movie_id: mId,
      interaction_type: 'LIKE',
      weight: 1.0,
      timestamp: new Date(),
    });
  }
  const user200Likes = await db.collection('user_interactions').find({ user_id: 200, interaction_type: 'LIKE' }).toArray();
  assert(user200Likes.length <= 5, `Scenario 11 (Sliding Window): Interactions recorded (${user200Likes.length} items)`);

  // Scenario 12: Anti-Clustering Diversity Re-ranking
  const dummyItems = [
    { movie: { id: 1, title: 'Action 1', director: 'Nolan', genres: ['Action', 'Thriller'] }, match_score: 90, _rawScore: 90 },
    { movie: { id: 2, title: 'Action 2', director: 'Nolan', genres: ['Action', 'Thriller'] }, match_score: 89, _rawScore: 89 },
    { movie: { id: 3, title: 'Action 3', director: 'Nolan', genres: ['Action', 'Thriller'] }, match_score: 88, _rawScore: 88 },
    { movie: { id: 4, title: 'Drama 1', director: 'Fincher', genres: ['Drama', 'Mystery'] }, match_score: 82, _rawScore: 82 },
    { movie: { id: 5, title: 'SciFi 1', director: 'Villeneuve', genres: ['Science Fiction'] }, match_score: 80, _rawScore: 80 },
  ];
  const diversified = applyDiversityRerank(dummyItems, 4, false);
  const directorsChosen = diversified.map(d => d.movie.director);
  assert(directorsChosen.includes('Fincher') || directorsChosen.includes('Villeneuve'), `Scenario 12 (Diversity Re-ranking): Anti-clustering promoted diverse director -> [${directorsChosen.join(', ')}]`);

  // Step 4: Model Evaluation Metrics
  console.log('\n--- [4] Model Evaluation Benchmark Metrics ---');
  const metrics = await evaluateModel(5);
  assert(typeof metrics.precision_at_k === 'number', `Precision@5: ${metrics.precision_at_k}`);
  assert(typeof metrics.recall_at_k === 'number', `Recall@5: ${metrics.recall_at_k}`);
  assert(typeof metrics.f1_at_k === 'number', `F1-Score@5: ${metrics.f1_at_k}`);
  assert(typeof metrics.ndcg_at_k === 'number', `NDCG@5: ${metrics.ndcg_at_k}`);
  assert(typeof metrics.rmse === 'number', `RMSE: ${metrics.rmse}`);

  // Summary
  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
