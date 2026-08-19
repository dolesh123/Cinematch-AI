const http = require('http');
const app = require('./server');

let server;
let passCount = 0;
let failCount = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failCount++;
  }
}

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runHttpTests() {
  const PORT = 8009;
  server = app.listen(PORT, '127.0.0.1');

  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('\n======================================================');
  console.log('🌐 Starting CineMatch AI HTTP Endpoint Verification');
  console.log('======================================================\n');

  try {
    // 1. Health Endpoint
    console.log('--- [1] Health & Root API ---');
    const health = await request({ host: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health returned 200 OK');

    // 2. Auth: Register & Login
    console.log('\n--- [2] Auth Routes ---');
    const testEmail = `student_${Date.now()}@cinematch.ai`;
    const regRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { name: 'Student Hacker', email: testEmail, password: 'password123' });

    assert(regRes.status === 200 && regRes.data.access_token, 'POST /api/auth/register returned JWT access_token');
    const token = regRes.data.access_token;
    const userId = regRes.data.user_id;

    const meRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(meRes.status === 200 && meRes.data.id === userId, 'GET /api/auth/me verified user profile');

    // 3. User Preferences
    console.log('\n--- [3] User Preferences Routes ---');
    const prefGet = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/preferences',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(prefGet.status === 200, 'GET /api/preferences returned user preferences');

    const prefPut = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/preferences',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, { preferred_genres: ['Sci-Fi', 'Action'], preferred_languages: ['English'], discovery_slider: 0.6 });
    assert(prefPut.status === 200 && prefPut.data.preferred_genres.includes('Sci-Fi'), 'PUT /api/preferences updated user taste profile');

    // 4. Movies Search & Lookup
    console.log('\n--- [4] Movie Catalog & Search Routes ---');
    const searchRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/movies/search?q=Inception',
      method: 'GET'
    });
    assert(searchRes.status === 200 && searchRes.data.length > 0 && searchRes.data[0].title === 'Inception', 'GET /api/movies/search?q=Inception returned exact title match');

    const movieRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: `/api/movies/${searchRes.data[0].id}`,
      method: 'GET'
    });
    assert(movieRes.status === 200 && movieRes.data.title === 'Inception', `GET /api/movies/:id returned movie details`);

    // 5. Dynamic Recommendations & Mood Queries
    console.log('\n--- [5] Recommendations Routes ---');
    const recsRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/recommendations?limit=6',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(recsRes.status === 200 && recsRes.data.length === 6, 'GET /api/recommendations returned top 6 recommendations');

    const moodRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/recommendations/mood',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, { prompt: 'space voyage with high suspense' });
    assert(moodRes.status === 200 && moodRes.data.length > 0, 'POST /api/recommendations/mood returned NLP tailored recommendations');

    // 6. Interactions & Watchlist
    console.log('\n--- [6] Interactions & Watchlist Routes ---');
    const feedbackRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/feedback',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, { movie_id: 27205, interaction_type: 'LIKE' });
    assert(feedbackRes.status === 200, 'POST /api/feedback recorded LIKE interaction');

    const watchAdd = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/watchlist',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, { movie_id: 27205 });
    assert(watchAdd.status === 200 && watchAdd.data.in_watchlist === true, 'POST /api/watchlist added movie to watchlist');

    const watchList = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/watchlist',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(watchList.status === 200 && watchList.data.some(m => m.id === 27205), 'GET /api/watchlist retrieved saved movie');

    // 7. Analytics & ML Metrics
    console.log('\n--- [7] Analytics & ML Metrics Routes ---');
    const tasteRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/my-taste',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(tasteRes.status === 200 && tasteRes.data.top_genres.length > 0, 'GET /api/my-taste returned user taste breakdown');

    const metricsRes = await request({
      host: '127.0.0.1',
      port: PORT,
      path: '/api/model/metrics',
      method: 'GET'
    });
    assert(metricsRes.status === 200 && metricsRes.data.precision_at_k !== undefined, 'GET /api/model/metrics returned ML hold-out evaluation');

    console.log('\n======================================================');
    console.log(`📊 HTTP API Test Results: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('HTTP Test Error:', err);
    failCount++;
  } finally {
    if (server) server.close();
    process.exit(failCount > 0 ? 1 : 0);
  }
}

runHttpTests();
