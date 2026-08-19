const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'cinematch';

async function syncToMongoDB() {
  console.log(`[Sync] Connecting to MongoDB at ${MONGO_URI} (DB: ${DB_NAME})...`);
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`[Sync] Connected successfully to ${DB_NAME}!`);

  const dataDir = path.join(__dirname, '..', 'data');

  // Helper to load JSON
  const loadJSON = (filename) => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) return [];
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn(`Failed to parse ${filename}:`, e.message);
      return [];
    }
  };

  // Helper to sanitize document
  const cleanDoc = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!k.startsWith('$') && k !== '_id') {
        clean[k] = v;
      }
    }
    return clean;
  };

  // 1. Sync Users
  const users = loadJSON('users.json');
  if (users.length > 0) {
    for (const u of users) {
      const doc = cleanDoc(u);
      if (doc.email) {
        try {
          await db.collection('users').updateOne(
            { email: doc.email },
            { $set: doc },
            { upsert: true }
          );
        } catch (err) {
          if (doc.id) {
            await db.collection('users').updateOne(
              { id: doc.id },
              { $set: doc },
              { upsert: true }
            ).catch(() => {});
          }
        }
      }
    }
    console.log(`[Sync] Synced ${users.length} users into 'users' collection.`);
  }

  // 2. Sync User Preferences
  const prefs = loadJSON('user_preferences.json');
  if (prefs.length > 0) {
    for (const p of prefs) {
      const doc = cleanDoc(p);
      if (doc.user_id) {
        await db.collection('user_preferences').updateOne(
          { user_id: Number(doc.user_id) },
          { $set: doc },
          { upsert: true }
        );
      }
    }
    console.log(`[Sync] Synced ${prefs.length} user preferences into 'user_preferences' collection.`);
  }

  // 3. Sync Ratings
  const ratings = loadJSON('ratings.json');
  if (ratings.length > 0) {
    for (const r of ratings) {
      const doc = cleanDoc(r);
      if (doc.user_id && doc.movie_id) {
        await db.collection('ratings').updateOne(
          { user_id: Number(doc.user_id), movie_id: Number(doc.movie_id) },
          { $set: doc },
          { upsert: true }
        );
      }
    }
    console.log(`[Sync] Synced ${ratings.length} ratings into 'ratings' collection.`);
  }

  // 4. Sync User Interactions
  const interactions = loadJSON('user_interactions.json');
  if (interactions.length > 0) {
    const existingCount = await db.collection('user_interactions').countDocuments();
    if (existingCount < interactions.length) {
      for (const item of interactions) {
        const doc = cleanDoc(item);
        await db.collection('user_interactions').insertOne(doc);
      }
      console.log(`[Sync] Synced ${interactions.length} interactions into 'user_interactions' collection.`);
    }
  }

  // 5. Sync Searches
  const searches = loadJSON('user_searches.json');
  if (searches.length > 0) {
    const existingCount = await db.collection('user_searches').countDocuments();
    if (existingCount < searches.length) {
      for (const item of searches) {
        const doc = cleanDoc(item);
        await db.collection('user_searches').insertOne(doc);
      }
      console.log(`[Sync] Synced ${searches.length} search logs into 'user_searches' collection.`);
    }
  }

  // 6. Sync Watchlists
  const watchlists = loadJSON('watchlists.json');
  if (watchlists.length > 0) {
    for (const w of watchlists) {
      const doc = cleanDoc(w);
      if (doc.user_id && doc.movie_id) {
        await db.collection('watchlists').updateOne(
          { user_id: Number(doc.user_id), movie_id: Number(doc.movie_id) },
          { $set: doc },
          { upsert: true }
        );
      }
    }
    console.log(`[Sync] Synced ${watchlists.length} watchlists into 'watchlists' collection.`);
  }

  // 7. Ensure Indexes
  await Promise.all([
    db.collection('movies').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
    db.collection('movies').createIndex({ title: 1 }).catch(() => {}),
    db.collection('users').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
    db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {}),
    db.collection('user_preferences').createIndex({ user_id: 1 }, { unique: true }).catch(() => {}),
    db.collection('ratings').createIndex({ user_id: 1, movie_id: 1 }, { unique: true }).catch(() => {}),
    db.collection('user_interactions').createIndex({ user_id: 1 }).catch(() => {}),
    db.collection('user_searches').createIndex({ user_id: 1, timestamp: -1 }).catch(() => {}),
    db.collection('watchlists').createIndex({ user_id: 1, movie_id: 1 }, { unique: true }).catch(() => {}),
  ]);
  console.log('[Sync] Created/verified all MongoDB collection indexes.');

  // Summary counts
  const cols = await db.listCollections().toArray();
  console.log('\n--- MongoDB Compass cinematch Database Summary ---');
  for (const c of cols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`Collection [${c.name}]: ${count} documents`);
  }

  await client.close();
  console.log('\n[Sync] Complete! MongoDB Compass is ready to inspect.');
}

if (require.main === module) {
  syncToMongoDB().catch(console.error);
}

module.exports = { syncToMongoDB };
