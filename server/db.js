const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dolesh123:dolesh123@cluster0.pww0cdb.mongodb.net/?appName=Cluster0';
const DB_NAME = process.env.MONGO_DB_NAME || 'cinematch';

let realDB = null;
let memoryDB = null;

// Poster & backdrop mappings for top movies
// Comprehensive Poster & backdrop mappings for top movies (100% Verified HTTP 200 OK)
const POPULAR_POSTERS = {
  // Sci-Fi / Cyberpunk / Space
  "Avatar": ["https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"],
  "Inception": ["https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"],
  "Interstellar": ["https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"],
  "The Matrix": ["https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"],
  "Blade Runner": ["https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"],
  "Star Wars": ["https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"],
  "Jurassic Park": ["https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop&q=80"],
  "Alien": ["https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"],
  "The Terminator": ["https://image.tmdb.org/t/p/w500/qvktm0BHcnmDpul4Hz01GIazWPr.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"],

  // Superhero & Action
  "The Dark Knight": ["https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"],
  "The Dark Knight Rises": ["https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"],
  "The Avengers": ["https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"],
  "Iron Man": ["https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"],
  "Spider-Man": ["https://image.tmdb.org/t/p/w500/rweIrveL43TaxUN0akQEaAXL6x0.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"],
  "Gladiator": ["https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"],

  // Classics / Drama / Crime
  "The Shawshank Redemption": ["https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"],
  "The Godfather": ["https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"],
  "Pulp Fiction": ["https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"],
  "Fight Club": ["https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"],
  "Forrest Gump": ["https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"],
  "GoodFellas": ["https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"],
  "Se7en": ["https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"],
  "The Silence of the Lambs": ["https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg", "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80"],
  "Whiplash": ["https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"],
  "The Prestige": ["https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"],
  "Memento": ["https://image.tmdb.org/t/p/w500/yuNs09hvpHVU1cBTCAk9zxsL2oW.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"],
  "The Wolf of Wall Street": ["https://image.tmdb.org/t/p/w500/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"],
  "Django Unchained": ["https://image.tmdb.org/t/p/w500/8kOWDBK6XlPUzckuHDo3wwVRFwt.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"],
  "Titanic": ["https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg", "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80"],

  // Animation / Family
  "Toy Story": ["https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"],
  "Up": ["https://image.tmdb.org/t/p/w500/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"],
  "The Lion King": ["https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"],
  "Coco": ["https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"],
  "Spirited Away": ["https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"],
  "Harry Potter and the Philosopher's Stone": ["https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80"],

  // Horror / Thriller
  "The Conjuring": ["https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg", "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80"]
};

const GENRE_POSTER_PALETTES = {
  "Horror": [
    ["https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Science Fiction": [
    ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"],
    ["https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80"],
    ["https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Action": [
    ["https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Animation": [
    ["https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"],
    ["https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Romance": [
    ["https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80"],
    ["https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Drama": [
    ["https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80"],
    ["https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Comedy": [
    ["https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80"],
    ["https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Thriller": [
    ["https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Crime": [
    ["https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Adventure": [
    ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80"]
  ],
  "Fantasy": [
    ["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"]
  ]
};

function getMovieImages(id, title, genres) {
  if (title && POPULAR_POSTERS[title]) {
    return POPULAR_POSTERS[title];
  }
  for (const g of (genres || [])) {
    if (GENRE_POSTER_PALETTES[g]) {
      const p = GENRE_POSTER_PALETTES[g];
      return p[Math.abs(Number(id || 0)) % p.length];
    }
  }
  const def = GENRE_POSTER_PALETTES["Drama"][0];
  return def;
}

// Fallback in-memory collection
class MemoryCollection {
  constructor(name, dataFile) {
    this.name = name;
    this.dataFile = dataFile;
    this.items = [];
    this.load();
  }

  load() {
    if (this.dataFile && fs.existsSync(this.dataFile)) {
      try {
        const raw = fs.readFileSync(this.dataFile, 'utf-8');
        this.items = JSON.parse(raw);
      } catch (e) {
        this.items = [];
      }
    }
  }

  save() {
    if (this.dataFile) {
      try {
        fs.writeFileSync(this.dataFile, JSON.stringify(this.items, null, 2), 'utf-8');
      } catch (e) {}
    }
  }

  async findOne(filter = {}) {
    const list = await this.find(filter).toArray();
    return list.length > 0 ? list[0] : null;
  }

  find(filter = {}) {
    let result = this.items.filter((doc) => {
      for (const [key, cond] of Object.entries(filter)) {
        if (key === '$or' && Array.isArray(cond)) {
          const matchOr = cond.some((subCond) => {
            for (const [subKey, subVal] of Object.entries(subCond)) {
              if (subVal && typeof subVal === 'object' && subVal.$regex) {
                const re = new RegExp(subVal.$regex, subVal.$options || '');
                if (!re.test(String(doc[subKey] || ''))) return false;
              } else if (doc[subKey] !== subVal) {
                return false;
              }
            }
            return true;
          });
          if (!matchOr) return false;
          continue;
        }

        if (cond && typeof cond === 'object') {
          if (cond.$regex) {
            const re = new RegExp(cond.$regex, cond.$options || '');
            if (!re.test(String(doc[key] || ''))) return false;
          } else if (cond.$in && Array.isArray(cond.$in)) {
            if (!cond.$in.includes(doc[key])) return false;
          } else if (cond.$gt !== undefined && !(doc[key] > cond.$gt)) {
            return false;
          } else if (cond.$gte !== undefined && !(doc[key] >= cond.$gte)) {
            return false;
          }
        } else if (doc[key] !== cond) {
          return false;
        }
      }
      return true;
    });

    const cursor = {
      _data: result,
      sort(sortObj = {}) {
        const [sortKey, sortDir] = Object.entries(sortObj)[0] || ['id', 1];
        this._data.sort((a, b) => (a[sortKey] > b[sortKey] ? sortDir : -sortDir));
        return this;
      },
      limit(n) {
        this._data = this._data.slice(0, n);
        return this;
      },
      async toArray() {
        return this._data;
      },
    };

    return cursor;
  }

  async insertOne(doc) {
    const item = { ...doc, _id: doc._id || String(Date.now() + Math.random()) };
    this.items.push(item);
    this.save();
    return { insertedId: item._id };
  }

  async insertMany(docs) {
    const insertedIds = [];
    for (const doc of docs) {
      const item = { ...doc, _id: doc._id || String(Date.now() + Math.random()) };
      this.items.push(item);
      insertedIds.push(item._id);
    }
    this.save();
    return { insertedIds };
  }

  async updateOne(filter, update, options = {}) {
    let existingIndex = this.items.findIndex((doc) => {
      for (const [k, v] of Object.entries(filter)) {
        if (doc[k] !== v) return false;
      }
      return true;
    });

    if (existingIndex !== -1) {
      if (update.$set) {
        this.items[existingIndex] = { ...this.items[existingIndex], ...update.$set };
      } else {
        this.items[existingIndex] = { ...this.items[existingIndex], ...update };
      }
      this.save();
      return { matchedCount: 1, modifiedCount: 1 };
    } else if (options.upsert) {
      const newDoc = { ...(filter || {}), ...(update.$set || update), _id: String(Date.now() + Math.random()) };
      this.items.push(newDoc);
      this.save();
      return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async deleteOne(filter) {
    const idx = this.items.findIndex((doc) => {
      for (const [k, v] of Object.entries(filter)) {
        if (doc[k] !== v) return false;
      }
      return true;
    });
    if (idx !== -1) {
      this.items.splice(idx, 1);
      this.save();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter = {}) {
    const toKeep = [];
    let deletedCount = 0;
    for (const doc of this.items) {
      let matchesFilter = true;
      for (const [key, cond] of Object.entries(filter)) {
        if (cond && typeof cond === 'object' && cond.$in && Array.isArray(cond.$in)) {
          if (!cond.$in.includes(doc[key])) {
            matchesFilter = false;
          }
        } else if (doc[key] !== cond) {
          matchesFilter = false;
        }
      }
      if (matchesFilter) {
        deletedCount++;
      } else {
        toKeep.push(doc);
      }
    }
    this.items = toKeep;
    this.save();
    return { deletedCount };
  }

  async countDocuments(filter = {}) {
    const list = await this.find(filter).toArray();
    return list.length;
  }

  async createIndex() {
    return true;
  }
}

class MemoryDatabase {
  constructor() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.collections = {
      movies: new MemoryCollection('movies', path.join(dataDir, 'movies.json')),
      users: new MemoryCollection('users', path.join(dataDir, 'users.json')),
      user_preferences: new MemoryCollection('user_preferences', path.join(dataDir, 'user_preferences.json')),
      ratings: new MemoryCollection('ratings', path.join(dataDir, 'ratings.json')),
      user_interactions: new MemoryCollection('user_interactions', path.join(dataDir, 'user_interactions.json')),
      user_searches: new MemoryCollection('user_searches', path.join(dataDir, 'user_searches.json')),
      watchlists: new MemoryCollection('watchlists', path.join(dataDir, 'watchlists.json')),
      recommendation_history: new MemoryCollection('recommendation_history', path.join(dataDir, 'recommendation_history.json')),
    };

    if (this.collections.movies.items.length === 0) {
      this.collections.movies.items = [
        { id: 27205, title: 'Inception', year: 2010, genres: ['Action', 'Thriller', 'Science Fiction', 'Mystery', 'Adventure'], rating: 8.1, vote_count: 13752, director: 'Christopher Nolan', cast_members: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page', 'Tom Hardy'], overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious...', poster_path: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80', popularity: 167.5, keywords: ['dream', 'heist', 'subconscious'], emotional_vibes: ['mind-bending', 'engaging'] },
        { id: 155, title: 'The Dark Knight', year: 2008, genres: ['Drama', 'Action', 'Crime', 'Thriller'], rating: 8.2, vote_count: 12002, director: 'Christopher Nolan', cast_members: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'], overview: 'Batman raises the stakes in his war on crime...', poster_path: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80', popularity: 187.3, keywords: ['dc comics', 'batman', 'joker'], emotional_vibes: ['dark', 'thrilling'] },
        { id: 157336, title: 'Interstellar', year: 2014, genres: ['Adventure', 'Drama', 'Science Fiction'], rating: 8.1, vote_count: 10867, director: 'Christopher Nolan', cast_members: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.', poster_path: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', popularity: 140.2, keywords: ['space travel', 'wormhole', 'black hole'], emotional_vibes: ['epic', 'philosophical'] },
        { id: 19995, title: 'Avatar', year: 2009, genres: ['Action', 'Adventure', 'Fantasy', 'Science Fiction'], rating: 7.2, vote_count: 11800, director: 'James Cameron', cast_members: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'], overview: 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission...', poster_path: 'https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg', backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', popularity: 150.4, keywords: ['alien planet', '3d', 'pandora'], emotional_vibes: ['visually stunning'] },
        { id: 597, title: 'Titanic', year: 1997, genres: ['Drama', 'Romance', 'Thriller'], rating: 7.5, vote_count: 7560, director: 'James Cameron', cast_members: ['Leonardo DiCaprio', 'Kate Winslet', 'Billy Zane'], overview: '84 years later, a 101-year-old woman named Rose DeWitt Bukater tells the story to her granddaughter...', poster_path: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', backdrop_path: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80', popularity: 100.0, keywords: ['shipwreck', 'romance', 'iceberg'], emotional_vibes: ['emotional', 'tragic'] },
        { id: 138843, title: 'The Conjuring', year: 2013, genres: ['Horror', 'Thriller'], rating: 7.5, vote_count: 3000, director: 'James Wan', cast_members: ['Vera Farmiga', 'Patrick Wilson', 'Lili Taylor'], overview: 'Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.', poster_path: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg', backdrop_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80', popularity: 90.0, keywords: ['haunting', 'demon', 'paranormal'], emotional_vibes: ['terrifying', 'chilling'] },
        { id: 948, title: 'Halloween', year: 1978, genres: ['Horror', 'Thriller'], rating: 7.5, vote_count: 2000, director: 'John Carpenter', cast_members: ['Jamie Lee Curtis', 'Donald Pleasence'], overview: 'Fifteen years after murdering his sister on Halloween night 1963, Michael Myers escapes from a mental hospital and returns to Haddonfield.', poster_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80', popularity: 75.0, keywords: ['slasher', 'serial killer', 'halloween'], emotional_vibes: ['suspenseful', 'scary'] },
        { id: 4232, title: 'Scream', year: 1996, genres: ['Horror', 'Mystery'], rating: 7.2, vote_count: 2200, director: 'Wes Craven', cast_members: ['Neve Campbell', 'Courteney Cox', 'David Arquette'], overview: 'A year after the murder of her mother, a teenage girl is terrorized by a new killer who targets the girl and her friends by using horror films as part of a deadly game.', poster_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80', popularity: 65.0, keywords: ['ghostface', 'slasher', 'teen'], emotional_vibes: ['clever', 'scary'] },
        { id: 694, title: 'The Shining', year: 1980, genres: ['Horror', 'Thriller'], rating: 8.2, vote_count: 6000, director: 'Stanley Kubrick', cast_members: ['Jack Nicholson', 'Shelley Duvall', 'Danny Lloyd'], overview: 'Jack Torrance accepts a caretaker job at the Overlook Hotel, where he, his wife, and their psychic son are isolated through winter.', poster_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80', popularity: 88.0, keywords: ['hotel', 'madness', 'psychic'], emotional_vibes: ['unsettling', 'masterpiece'] },
        { id: 244786, title: 'Whiplash', year: 2014, genres: ['Drama'], rating: 8.3, vote_count: 4200, director: 'Damien Chazelle', cast_members: ['Miles Teller', 'J.K. Simmons'], overview: 'Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost.', poster_path: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg', backdrop_path: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80', popularity: 95.0, keywords: ['drums', 'jazz', 'obsession'], emotional_vibes: ['intense', 'electrifying'] },
        { id: 1124, title: 'The Prestige', year: 2006, genres: ['Drama', 'Mystery', 'Thriller'], rating: 8.0, vote_count: 4391, director: 'Christopher Nolan', cast_members: ['Hugh Jackman', 'Christian Bale', 'Michael Caine', 'Scarlett Johansson'], overview: 'A mysterious story of two magicians whose intense rivalry leads them on a life-long battle for supremacy...', poster_path: 'https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg', backdrop_path: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80', popularity: 74.0, keywords: ['magic', 'rivalry', 'obsessive'], emotional_vibes: ['clever', 'mind-bending'] },
        { id: 77, title: 'Memento', year: 2000, genres: ['Mystery', 'Thriller'], rating: 8.1, vote_count: 4028, director: 'Christopher Nolan', cast_members: ['Guy Pearce', 'Carrie-Anne Moss', 'Joe Pantoliano'], overview: 'Leonard Shelby is tracking down the man who raped and murdered his wife...', poster_path: 'https://image.tmdb.org/t/p/w500/yuNs09hvpHVU1cBTCAk9zxsL2oW.jpg', backdrop_path: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80', popularity: 60.0, keywords: ['amnesia', 'memory loss', 'revenge'], emotional_vibes: ['puzzle', 'suspenseful'] },
        { id: 38757, title: 'Tangled', year: 2010, genres: ['Animation', 'Family'], rating: 7.4, vote_count: 3330, director: 'Nathan Greno', cast_members: ['Mandy Moore', 'Zachary Levi', 'Donna Murphy'], overview: 'When the kingdom most wanted bandit Flynn Rider hides out in a mysterious tower...', poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80', popularity: 48.6, keywords: ['princess', 'fairy tale', 'magic'], emotional_vibes: ['delightful', 'charming'] },
        { id: 10681, title: 'WALL·E', year: 2008, genres: ['Animation', 'Family', 'Science Fiction'], rating: 8.0, vote_count: 6296, director: 'Andrew Stanton', cast_members: ['Ben Burtt', 'Elissa Knight', 'Jeff Garlin'], overview: 'WALL·E is the last robot left on an Earth that has been desolated by pollution...', poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', popularity: 66.3, keywords: ['robot', 'space', 'earth'], emotional_vibes: ['heartwarming', 'visionary'] },
      ];
      this.collections.movies.save();
    }
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new MemoryCollection(name, null);
    }
    return this.collections[name];
  }
}

memoryDB = new MemoryDatabase();

async function seedAtlasIfEmpty(db) {
  try {
    const movieCount = await db.collection('movies').countDocuments();
    if (movieCount === 0) {
      console.log('[MongoDB Atlas] Seeding movies and users into MongoDB Atlas...');
      
      const seedMovies = [
        { id: 27205, title: 'Inception', year: 2010, genres: ['Action', 'Thriller', 'Science Fiction', 'Mystery', 'Adventure'], rating: 8.1, vote_count: 13752, director: 'Christopher Nolan', cast_members: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page', 'Tom Hardy'], overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious...', poster_path: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80', popularity: 167.5, keywords: ['dream', 'heist', 'subconscious'], emotional_vibes: ['mind-bending', 'engaging'] },
        { id: 155, title: 'The Dark Knight', year: 2008, genres: ['Drama', 'Action', 'Crime', 'Thriller'], rating: 8.2, vote_count: 12002, director: 'Christopher Nolan', cast_members: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'], overview: 'Batman raises the stakes in his war on crime...', poster_path: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80', popularity: 187.3, keywords: ['dc comics', 'batman', 'joker'], emotional_vibes: ['dark', 'thrilling'] },
        { id: 157336, title: 'Interstellar', year: 2014, genres: ['Adventure', 'Drama', 'Science Fiction'], rating: 8.1, vote_count: 10867, director: 'Christopher Nolan', cast_members: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.', poster_path: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', popularity: 140.2, keywords: ['space travel', 'wormhole', 'black hole'], emotional_vibes: ['epic', 'philosophical'] },
        { id: 19995, title: 'Avatar', year: 2009, genres: ['Action', 'Adventure', 'Fantasy', 'Science Fiction'], rating: 7.2, vote_count: 11800, director: 'James Cameron', cast_members: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'], overview: 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission...', poster_path: 'https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg', backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', popularity: 150.4, keywords: ['alien planet', '3d', 'pandora'], emotional_vibes: ['visually stunning'] },
        { id: 597, title: 'Titanic', year: 1997, genres: ['Drama', 'Romance', 'Thriller'], rating: 7.5, vote_count: 7560, director: 'James Cameron', cast_members: ['Leonardo DiCaprio', 'Kate Winslet', 'Billy Zane'], overview: '84 years later, a 101-year-old woman named Rose DeWitt Bukater tells the story to her granddaughter...', poster_path: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', backdrop_path: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80', popularity: 100.0, keywords: ['shipwreck', 'romance', 'iceberg'], emotional_vibes: ['emotional', 'tragic'] },
        { id: 138843, title: 'The Conjuring', year: 2013, genres: ['Horror', 'Thriller'], rating: 7.5, vote_count: 3000, director: 'James Wan', cast_members: ['Vera Farmiga', 'Patrick Wilson', 'Lili Taylor'], overview: 'Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.', poster_path: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg', backdrop_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80', popularity: 90.0, keywords: ['haunting', 'demon', 'paranormal'], emotional_vibes: ['terrifying', 'chilling'] },
        { id: 948, title: 'Halloween', year: 1978, genres: ['Horror', 'Thriller'], rating: 7.5, vote_count: 2000, director: 'John Carpenter', cast_members: ['Jamie Lee Curtis', 'Donald Pleasence'], overview: 'Fifteen years after murdering his sister on Halloween night 1963, Michael Myers escapes from a mental hospital and returns to Haddonfield.', poster_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80', popularity: 75.0, keywords: ['slasher', 'serial killer', 'halloween'], emotional_vibes: ['suspenseful', 'scary'] },
        { id: 4232, title: 'Scream', year: 1996, genres: ['Horror', 'Mystery'], rating: 7.2, vote_count: 2200, director: 'Wes Craven', cast_members: ['Neve Campbell', 'Courteney Cox', 'David Arquette'], overview: 'A year after the murder of her mother, a teenage girl is terrorized by a new killer who targets the girl and her friends by using horror films as part of a deadly game.', poster_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80', popularity: 65.0, keywords: ['ghostface', 'slasher', 'teen'], emotional_vibes: ['clever', 'scary'] },
        { id: 694, title: 'The Shining', year: 1980, genres: ['Horror', 'Thriller'], rating: 8.2, vote_count: 6000, director: 'Stanley Kubrick', cast_members: ['Jack Nicholson', 'Shelley Duvall', 'Danny Lloyd'], overview: 'Jack Torrance accepts a caretaker job at the Overlook Hotel, where he, his wife, and their psychic son are isolated through winter.', poster_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80', popularity: 88.0, keywords: ['hotel', 'madness', 'psychic'], emotional_vibes: ['unsettling', 'masterpiece'] },
        { id: 244786, title: 'Whiplash', year: 2014, genres: ['Drama'], rating: 8.3, vote_count: 4200, director: 'Damien Chazelle', cast_members: ['Miles Teller', 'J.K. Simmons'], overview: 'Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost.', poster_path: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg', backdrop_path: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80', popularity: 95.0, keywords: ['drums', 'jazz', 'obsession'], emotional_vibes: ['intense', 'electrifying'] },
        { id: 1124, title: 'The Prestige', year: 2006, genres: ['Drama', 'Mystery', 'Thriller'], rating: 8.0, vote_count: 4391, director: 'Christopher Nolan', cast_members: ['Hugh Jackman', 'Christian Bale', 'Michael Caine', 'Scarlett Johansson'], overview: 'A mysterious story of two magicians whose intense rivalry leads them on a life-long battle for supremacy...', poster_path: 'https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg', backdrop_path: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80', popularity: 74.0, keywords: ['magic', 'rivalry', 'obsessive'], emotional_vibes: ['clever', 'mind-bending'] },
        { id: 77, title: 'Memento', year: 2000, genres: ['Mystery', 'Thriller'], rating: 8.1, vote_count: 4028, director: 'Christopher Nolan', cast_members: ['Guy Pearce', 'Carrie-Anne Moss', 'Joe Pantoliano'], overview: 'Leonard Shelby is tracking down the man who raped and murdered his wife...', poster_path: 'https://image.tmdb.org/t/p/w500/yuNs09hvpHVU1cBTCAk9zxsL2oW.jpg', backdrop_path: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80', popularity: 60.0, keywords: ['amnesia', 'memory loss', 'revenge'], emotional_vibes: ['puzzle', 'suspenseful'] },
        { id: 38757, title: 'Tangled', year: 2010, genres: ['Animation', 'Family'], rating: 7.4, vote_count: 3330, director: 'Nathan Greno', cast_members: ['Mandy Moore', 'Zachary Levi', 'Donna Murphy'], overview: 'When the kingdom most wanted bandit Flynn Rider hides out in a mysterious tower...', poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80', popularity: 48.6, keywords: ['princess', 'fairy tale', 'magic'], emotional_vibes: ['delightful', 'charming'] },
        { id: 10681, title: 'WALL·E', year: 2008, genres: ['Animation', 'Family', 'Science Fiction'], rating: 8.0, vote_count: 6296, director: 'Andrew Stanton', cast_members: ['Ben Burtt', 'Elissa Knight', 'Jeff Garlin'], overview: 'WALL·E is the last robot left on an Earth that has been desolated by pollution...', poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', popularity: 66.3, keywords: ['robot', 'space', 'earth'], emotional_vibes: ['heartwarming', 'visionary'] },
      ];

      await db.collection('movies').insertMany(seedMovies);

      const bcrypt = require('bcryptjs');
      const passHash = bcrypt.hashSync('password123', 10);
      const adminHash = bcrypt.hashSync('admin123', 10);

      await db.collection('users').insertMany([
        { id: 1, name: 'Alex Vance (Sci-Fi Fan)', email: 'scifi_user@cinematch.ai', password_hash: passHash, is_admin: false, created_at: new Date() },
        { id: 2, name: 'Sophia Rose (Romance Fan)', email: 'romance_user@cinematch.ai', password_hash: passHash, is_admin: false, created_at: new Date() },
        { id: 3, name: 'Leo Das (Animation Fan)', email: 'animation_user@cinematch.ai', password_hash: passHash, is_admin: false, created_at: new Date() },
        { id: 4, name: 'Hackathon Evaluator', email: 'admin@cinematch.ai', password_hash: adminHash, is_admin: true, created_at: new Date() },
      ]);

      await db.collection('user_preferences').insertMany([
        { id: 1, user_id: 1, preferred_genres: ['Sci-Fi', 'Thriller', 'Mystery'], preferred_languages: ['English'], min_rating: 7.5, max_rating: 10.0, discovery_slider: 0.4, preferred_era: ['2010-2020', '2020+'], favorite_movies: [157336, 27205], onboarding_completed: true, updated_at: new Date() },
        { id: 2, user_id: 2, preferred_genres: ['Romance', 'Drama'], preferred_languages: ['English'], min_rating: 7.0, max_rating: 10.0, discovery_slider: 0.5, preferred_era: ['1980-2000', '2000-2010', '2010-2020'], favorite_movies: [597], onboarding_completed: true, updated_at: new Date() },
        { id: 3, user_id: 3, preferred_genres: ['Animation', 'Family', 'Adventure'], preferred_languages: ['English'], min_rating: 7.0, max_rating: 10.0, discovery_slider: 0.3, preferred_era: ['2000-2010', '2010-2020', '2020+'], favorite_movies: [38757, 10681], onboarding_completed: true, updated_at: new Date() },
        { id: 4, user_id: 4, preferred_genres: ['Action', 'Sci-Fi', 'Crime', 'Drama'], preferred_languages: ['English'], min_rating: 6.5, max_rating: 10.0, discovery_slider: 0.5, preferred_era: [], favorite_movies: [27205, 155], onboarding_completed: true, updated_at: new Date() },
      ]);

      console.log('[MongoDB Atlas] Seeded default movie catalog and demo users successfully.');
    }
  } catch (err) {
    console.warn('[MongoDB Atlas Seed Note]:', err.message);
  }
}

// High-speed In-Memory Movie Catalog Cache
let movieCache = null;
let movieMapCache = null;
let lastMovieFetch = 0;
const MOVIE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes TTL

async function getCachedMovies() {
  const now = Date.now();
  if (movieCache && movieCache.length > 0 && now - lastMovieFetch < MOVIE_CACHE_TTL) {
    return movieCache;
  }

  const db = getDB();
  if (!db) return movieCache || [];

  try {
    const movies = await db.collection('movies').find({}).toArray();
    if (movies && movies.length > 0) {
      movieCache = movies;
      movieMapCache = new Map();
      for (const m of movies) {
        movieMapCache.set(Number(m.id), m);
      }
      lastMovieFetch = now;
      return movieCache;
    }
  } catch (err) {
    console.warn('[Cache Warning] Failed to refresh movies cache:', err.message);
  }
  return movieCache || [];
}

async function getCachedMovieById(id) {
  const numId = Number(id);
  if (!movieMapCache) {
    await getCachedMovies();
  }
  if (movieMapCache && movieMapCache.has(numId)) {
    return movieMapCache.get(numId);
  }
  const db = getDB();
  if (db) {
    return await db.collection('movies').findOne({ id: numId });
  }
  return null;
}

function invalidateMovieCache() {
  movieCache = null;
  movieMapCache = null;
  lastMovieFetch = 0;
}

async function prewarmCache() {
  try {
    const t0 = Date.now();
    const list = await getCachedMovies();
    console.log(`[High-Speed Cache] Pre-warmed ${list.length} movies into in-memory cache in ${Date.now() - t0}ms`);
  } catch (e) {
    console.warn('[High-Speed Cache Notice]:', e.message);
  }
}

async function connectDB() {
  if (realDB) return realDB;

  try {
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    await client.connect();
    realDB = client.db(DB_NAME);
    console.log(`[MongoDB Atlas] Connected successfully to Atlas Cluster (DB: ${DB_NAME})`);

    // Ensure helpful indexes on Atlas asynchronously without blocking
    Promise.all([
      realDB.collection('movies').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      realDB.collection('movies').createIndex({ title: 1 }).catch(() => {}),
      realDB.collection('users').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      realDB.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {}),
      realDB.collection('user_preferences').createIndex({ user_id: 1 }, { unique: true }).catch(() => {}),
      realDB.collection('ratings').createIndex({ user_id: 1, movie_id: 1 }, { unique: true }).catch(() => {}),
      realDB.collection('user_interactions').createIndex({ user_id: 1 }).catch(() => {}),
      realDB.collection('user_searches').createIndex({ user_id: 1, timestamp: -1 }).catch(() => {}),
      realDB.collection('watchlists').createIndex({ user_id: 1, movie_id: 1 }, { unique: true }).catch(() => {}),
    ]).catch(() => {});

    await seedAtlasIfEmpty(realDB);
    prewarmCache();
    return realDB;
  } catch (err) {
    console.warn(`[MongoDB Notice] Atlas unavailable (${err.message}). Using embedded resilient MongoDB engine.`);
    prewarmCache();
    return memoryDB;
  }
}

function getDB() {
  return realDB || memoryDB;
}

module.exports = {
  connectDB,
  getDB,
  getMovieImages,
  getCachedMovies,
  getCachedMovieById,
  invalidateMovieCache,
  prewarmCache,
};
