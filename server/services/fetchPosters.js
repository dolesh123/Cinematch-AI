const fs = require('fs');
const path = require('path');
const https = require('https');

const CACHE_FILE = path.join(__dirname, '../../data/poster_cache.json');
const MOVIES_FILE = path.join(__dirname, '../../data/movies.json');

// Read existing cache
let posterCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    posterCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch (e) {
    posterCache = {};
  }
}

// Clean out nulls from posterCache
for (const key of Object.keys(posterCache)) {
  if (!posterCache[key] || posterCache[key].startsWith('data:image/svg')) {
    delete posterCache[key];
  }
}

function fetchPosterForTitle(title, year) {
  return new Promise((resolve) => {
    if (!title || typeof title !== 'string') return resolve(null);
    const cleanTitle = title.trim();
    if (posterCache[cleanTitle]) {
      return resolve(posterCache[cleanTitle]);
    }

    const q = encodeURIComponent(cleanTitle);
    const y = year ? `&y=${year}` : '';
    const url = `https://www.omdbapi.com/?t=${q}${y}&apikey=trilogy`;

    const req = https.get(url, { timeout: 4000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.Response === 'True' && json.Poster && json.Poster.startsWith('http') && json.Poster !== 'N/A') {
            posterCache[cleanTitle] = json.Poster;
            return resolve(json.Poster);
          }
        } catch (e) {}
        resolve(null);
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function runBatch(items, concurrency = 15) {
  console.log(`Starting poster fetch for ${items.length} titles with concurrency ${concurrency}...`);
  let index = 0;
  let successCount = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      const title = typeof item === 'string' ? item : item.title;
      const year = typeof item === 'object' ? item.year : undefined;
      
      const poster = await fetchPosterForTitle(title, year);
      if (poster) {
        successCount++;
      }
      if (i % 50 === 0) {
        console.log(`Progress: ${i}/${items.length} (Fetched ${successCount} valid posters)`);
        // Periodic save
        fs.writeFileSync(CACHE_FILE, JSON.stringify(posterCache, null, 2));
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  fs.writeFileSync(CACHE_FILE, JSON.stringify(posterCache, null, 2));
  console.log(`Completed! Total posters in cache: ${Object.keys(posterCache).length}`);
}

module.exports = {
  fetchPosterForTitle,
  posterCache,
  runBatch
};

if (require.main === module) {
  const { getDB, connectDB } = require('../db');
  connectDB().then(async (db) => {
    let movies = [];
    if (db) {
      movies = await db.collection('movies').find({}).toArray();
    }
    if (!movies || movies.length === 0) {
      if (fs.existsSync(MOVIES_FILE)) {
        movies = JSON.parse(fs.readFileSync(MOVIES_FILE, 'utf-8'));
      }
    }
    
    // Sort movies by popularity / vote_count so top movies get fetched first
    movies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    await runBatch(movies, 20);
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
