const fs = require('fs');
const path = require('path');
const https = require('https');

const CACHE_FILE = path.join(__dirname, '../../data/poster_cache.json');
let posterCache = {};

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (data && typeof data === 'object') {
        posterCache = data;
      }
    }
  } catch (e) {
    // Keep in-memory cache
  }
}

// Initial load
loadCache();

// Periodically reload cache if updated by background jobs
setInterval(loadCache, 5000);

// Curated verified authentic posters for top franchises & iconic titles
const CURATED_POSTERS = {
  // Spider-Man franchise
  "Spider-Man": "https://upload.wikimedia.org/wikipedia/en/6/6c/Spider-Man_%282002_film%29_poster.jpg",
  "Spider-Man 2": "https://upload.wikimedia.org/wikipedia/en/4/4e/Spider-Man_2_USA_poster.jpg",
  "Spider-Man 3": "https://upload.wikimedia.org/wikipedia/en/7/7a/Spider-Man_3%2C_International_Poster.jpg",
  "Spider": "https://upload.wikimedia.org/wikipedia/en/1/1e/Spider_film.jpg",
  "Spider-Man: Homecoming": "https://image.tmdb.org/t/p/w500/c24sv2weTHPsmDa7jEMN0m2P3RT.jpg",
  "Spider-Man: Far From Home": "https://upload.wikimedia.org/wikipedia/en/b/bd/Spider-Man_Far_From_Home_poster.jpg",
  "Spider-Man: No Way Home": "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
  "Spider-Man: Into the Spider-Verse": "https://image.tmdb.org/t/p/w500/uJYYizSuA9Y3DCs0qS4qWvHfZg4.jpg",
  "Spider-Man: Across the Spider-Verse": "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
  "The Amazing Spider-Man": "https://upload.wikimedia.org/wikipedia/en/0/02/The_Amazing_Spider-Man_theatrical_poster.jpeg",
  "The Amazing Spider-Man 2": "https://upload.wikimedia.org/wikipedia/en/0/02/The_Amazing_Spider-Man_2_poster.jpg",
  
  // Batman & DC
  "Batman": "https://upload.wikimedia.org/wikipedia/en/5/5a/Batman_%281989_film%29_poster.jpg",
  "Batman Returns": "https://upload.wikimedia.org/wikipedia/en/c/c1/Batman_returns_poster2.jpg",
  "Batman Forever": "https://upload.wikimedia.org/wikipedia/en/8/82/Batman_Forever_poster.jpg",
  "Batman & Robin": "https://upload.wikimedia.org/wikipedia/en/3/37/Batman_%26_Robin_poster.jpg",
  "Batman Begins": "https://upload.wikimedia.org/wikipedia/en/a/af/Batman_Begins_Poster.jpg",
  "The Dark Knight": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "The Dark Knight Rises": "https://upload.wikimedia.org/wikipedia/en/8/83/Dark_knight_rises_poster.jpg",
  "Man of Steel": "https://upload.wikimedia.org/wikipedia/en/8/85/ManofSteelFinalPoster.jpg",
  "Batman v Superman: Dawn of Justice": "https://upload.wikimedia.org/wikipedia/en/2/20/Batman_v_Superman_poster.jpg",
  "Justice League": "https://upload.wikimedia.org/wikipedia/en/3/31/Justice_League_film_poster.jpg",
  "Wonder Woman": "https://upload.wikimedia.org/wikipedia/en/e/ed/Wonder_Woman_%282017_film%29.png",
  "Aquaman": "https://upload.wikimedia.org/wikipedia/en/3/3a/Aquaman_poster.jpg",
  "Joker": "https://upload.wikimedia.org/wikipedia/en/e/e1/Joker_%282019_film%29_poster.jpg",

  // Marvel
  "Iron Man": "https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg",
  "Iron Man 2": "https://upload.wikimedia.org/wikipedia/en/e/ed/Iron_Man_2_poster.jpg",
  "Iron Man 3": "https://upload.wikimedia.org/wikipedia/en/1/19/Iron_Man_3_poster.jpg",
  "The Avengers": "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
  "Avengers: Age of Ultron": "https://upload.wikimedia.org/wikipedia/en/f/ff/Avengers_Age_of_Ultron_poster.jpg",
  "Avengers: Infinity War": "https://upload.wikimedia.org/wikipedia/en/4/4d/Avengers_Infinity_War_poster.jpg",
  "Avengers: Endgame": "https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg",
  "Captain America: The First Avenger": "https://upload.wikimedia.org/wikipedia/en/3/37/Captain_America_The_First_Avenger_poster.jpg",
  "Captain America: The Winter Soldier": "https://upload.wikimedia.org/wikipedia/en/e/e8/Captain_America_The_Winter_Soldier.jpg",
  "Captain America: Civil War": "https://upload.wikimedia.org/wikipedia/en/5/53/Captain_America_Civil_War_poster.jpg",
  "Thor": "https://upload.wikimedia.org/wikipedia/en/f/fc/Thor_poster.jpg",
  "Thor: The Dark World": "https://upload.wikimedia.org/wikipedia/en/7/7e/Thor_-_The_Dark_World_poster.jpg",
  "Thor: Ragnarok": "https://upload.wikimedia.org/wikipedia/en/7/7d/Thor_Ragnarok_poster.jpg",
  "Guardians of the Galaxy": "https://upload.wikimedia.org/wikipedia/en/b/b5/Guardians_of_the_Galaxy_poster.jpg",
  "Guardians of the Galaxy Vol. 2": "https://upload.wikimedia.org/wikipedia/en/a/ab/Guardians_of_the_Galaxy_Vol_2_poster.jpg",
  "Deadpool": "https://upload.wikimedia.org/wikipedia/en/2/23/Deadpool_%282016_poster%29.png",
  "Deadpool 2": "https://upload.wikimedia.org/wikipedia/en/c/cf/Deadpool_2_poster.jpg",
  "Doctor Strange": "https://upload.wikimedia.org/wikipedia/en/a/a1/Doctor_Strange_poster.jpg",
  "Black Panther": "https://upload.wikimedia.org/wikipedia/en/d/d6/Black_Panther_film_poster.jpg",

  // Sci-Fi Classics & Blockbusters
  "Inception": "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
  "Interstellar": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  "Avatar": "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
  "The Matrix": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  "The Matrix Reloaded": "https://upload.wikimedia.org/wikipedia/en/b/ba/Poster_-_The_Matrix_Reloaded.jpg",
  "The Matrix Revolutions": "https://upload.wikimedia.org/wikipedia/en/3/34/Matrix_revolutions_ver7.jpg",
  "Blade Runner": "https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg",
  "Blade Runner 2049": "https://upload.wikimedia.org/wikipedia/en/9/9b/Blade_Runner_2049_poster.png",
  "Star Wars": "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
  "Jurassic Park": "https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg",
  "Alien": "https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg",
  "The Terminator": "https://image.tmdb.org/t/p/w500/qvktm0BHcnmDpul4Hz01GIazWPr.jpg",
  "Terminator 2: Judgment Day": "https://upload.wikimedia.org/wikipedia/en/8/85/Terminator2poster.jpg",
  "WALL·E": "https://image.tmdb.org/t/p/w500/hBhgo42r0A65QdJyV8i9LpsX34q.jpg",

  // Drama / Crime / Thriller
  "The Shawshank Redemption": "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
  "The Godfather": "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  "The Godfather Part II": "https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_part_ii.jpg",
  "Pulp Fiction": "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
  "Fight Club": "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "Forrest Gump": "https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
  "GoodFellas": "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
  "Se7en": "https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg",
  "The Silence of the Lambs": "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
  "Whiplash": "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
  "The Prestige": "https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg",
  "Memento": "https://image.tmdb.org/t/p/w500/yuNs09hvpHVU1cBTCAk9zxsL2oW.jpg",
  "The Wolf of Wall Street": "https://image.tmdb.org/t/p/w500/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg",
  "Django Unchained": "https://image.tmdb.org/t/p/w500/8kOWDBK6XlPUzckuHDo3wwVRFwt.jpg",
  "Titanic": "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",

  // Animation & Family
  "Toy Story": "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg",
  "Toy Story 2": "https://upload.wikimedia.org/wikipedia/en/c/c0/Toy_Story_2.jpg",
  "Toy Story 3": "https://upload.wikimedia.org/wikipedia/en/6/69/Toy_Story_3_poster.jpg",
  "Up": "https://image.tmdb.org/t/p/w500/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg",
  "The Lion King": "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg",
  "Coco": "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg",
  "Spirited Away": "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  "Harry Potter and the Philosopher's Stone": "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
  "The Conjuring": "https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg",
  "Tangled": "https://upload.wikimedia.org/wikipedia/en/a/a8/Tangled_poster.jpg",
  "Gladiator": "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
  "The Martian": "https://upload.wikimedia.org/wikipedia/en/7/71/The_Martian_film_poster.jpg",
  "Gravity": "https://upload.wikimedia.org/wikipedia/en/f/f6/Gravity_Poster.jpg",
  "Arrival": "https://upload.wikimedia.org/wikipedia/en/d/df/Arrival%2C_Movie_Poster.jpg",
  "Tenet": "https://upload.wikimedia.org/wikipedia/en/1/14/Tenet_movie_poster.jpg"
};

// High-Definition Cinematic Thematic Poster Palettes (Ensures stunning photography if external API is slow)
const GENRE_CINEMATIC_BACKDROPS = {
  Action: [
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80"
  ],
  Adventure: [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80"
  ],
  "Science Fiction": [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"
  ],
  Thriller: [
    "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop&q=80"
  ],
  Horror: [
    "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
  ],
  Drama: [
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80"
  ],
  Crime: [
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80"
  ],
  Romance: [
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80"
  ],
  Animation: [
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80"
  ],
  Comedy: [
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80"
  ]
};

function getGenreBackdrop(title, genres) {
  const gList = Array.isArray(genres) && genres.length > 0 ? genres : ['Drama'];
  for (const g of gList) {
    if (GENRE_CINEMATIC_BACKDROPS[g]) {
      const palette = GENRE_CINEMATIC_BACKDROPS[g];
      const charCodeSum = (title || 'Film').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return palette[charCodeSum % palette.length];
    }
  }
  return GENRE_CINEMATIC_BACKDROPS.Drama[0];
}

// Background asynchronous resolver for missing posters
function resolvePosterAsync(title, year) {
  if (!title) return;
  const cleanTitle = title.trim();
  if (posterCache[cleanTitle] || CURATED_POSTERS[cleanTitle]) return;

  const q = encodeURIComponent(cleanTitle);
  const y = year ? `&y=${year}` : '';
  const url = `https://www.omdbapi.com/?t=${q}${y}&apikey=trilogy`;

  https.get(url, { timeout: 3000 }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.Response === 'True' && json.Poster && json.Poster.startsWith('http') && json.Poster !== 'N/A') {
          posterCache[cleanTitle] = json.Poster;
          // Asynchronously write to disk
          fs.writeFile(CACHE_FILE, JSON.stringify(posterCache, null, 2), () => {});
        }
      } catch (e) {}
    });
  }).on('error', () => {});
}

// Synchronous fast poster getter
function getMoviePoster(title, year, genres, director) {
  if (!title) return getGenreBackdrop('Movie', genres);

  const cleanTitle = title.trim();

  // 1. Check curated high-definition posters
  if (CURATED_POSTERS[cleanTitle]) {
    return CURATED_POSTERS[cleanTitle];
  }

  // 2. Check local disk/memory cache (which contains thousands of authentic posters)
  if (posterCache[cleanTitle] && posterCache[cleanTitle].startsWith('http')) {
    return posterCache[cleanTitle];
  }

  // 3. Trigger background fetch for future requests
  resolvePosterAsync(cleanTitle, year);

  // 4. Return high-definition cinematic genre photography as immediate non-breaking poster
  return getGenreBackdrop(cleanTitle, genres);
}

module.exports = {
  getMoviePoster,
  getGenreBackdrop,
  resolvePosterAsync,
  CURATED_POSTERS
};
