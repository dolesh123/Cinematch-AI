const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../../data/poster_cache.json');
let posterCache = {};

// Load persistent poster cache if available
try {
  if (fs.existsSync(CACHE_FILE)) {
    posterCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }
} catch (e) {
  posterCache = {};
}

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
  "Deadpool": "https://upload.wikimedia.org/wikipedia/en/c/ca/Deadpool.png",
  "Deadpool 2": "https://upload.wikimedia.org/wikipedia/en/c/cf/Deadpool_2_poster.jpg",
  "Doctor Strange": "https://upload.wikimedia.org/wikipedia/en/a/a1/Doctor_Strange_poster.jpg",
  "Black Panther": "https://upload.wikimedia.org/wikipedia/en/d/d6/Black_Panther_film_poster.jpg",

  // Sci-Fi & Classics
  "Avatar": "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
  "Inception": "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
  "Interstellar": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  "The Matrix": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  "The Matrix Reloaded": "https://upload.wikimedia.org/wikipedia/en/b/ba/Poster_-_The_Matrix_Reloaded.jpg",
  "The Matrix Revolutions": "https://upload.wikimedia.org/wikipedia/en/3/34/Matrix_revolutions_ver7.jpg",
  "Blade Runner": "https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg",
  "Blade Runner 2049": "https://upload.wikimedia.org/wikipedia/en/9/9b/Blade_Runner_2049_poster.png",
  "Star Wars": "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
  "The Empire Strikes Back": "https://upload.wikimedia.org/wikipedia/en/3/3f/The_Empire_Strikes_Back_%281980_film%29_poster.jpg",
  "Return of the Jedi": "https://upload.wikimedia.org/wikipedia/en/b/b2/ReturnOfTheJediPoster1983.jpg",
  "Jurassic Park": "https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg",
  "Jurassic World": "https://upload.wikimedia.org/wikipedia/en/6/6e/Jurassic_World_poster.jpg",
  "Alien": "https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg",
  "Aliens": "https://upload.wikimedia.org/wikipedia/en/f/fb/Aliens_poster.jpg",
  "The Terminator": "https://image.tmdb.org/t/p/w500/qvktm0BHcnmDpul4Hz01GIazWPr.jpg",
  "Terminator 2: Judgment Day": "https://upload.wikimedia.org/wikipedia/en/8/85/Terminator2judgmentday.jpg",
  "The Shawshank Redemption": "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
  "The Godfather": "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  "The Godfather: Part II": "https://upload.wikimedia.org/wikipedia/en/0/03/Godfather_part_ii.jpg",
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
  "The Conjuring": "https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg",
  "Halloween": "https://upload.wikimedia.org/wikipedia/en/a/af/Halloween_%281978%29_theatrical_poster.jpg",
  "Scream": "https://upload.wikimedia.org/wikipedia/en/8/86/Scream_%281996_film%29_poster.jpg",
  "The Shining": "https://upload.wikimedia.org/wikipedia/en/1/1d/The_Shining_%281980%29_theatrical_poster.jpg",
  "Toy Story": "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg",
  "Up": "https://image.tmdb.org/t/p/w500/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg",
  "The Lion King": "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg",
  "Coco": "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg",
  "Spirited Away": "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  "WALL·E": "https://upload.wikimedia.org/wikipedia/en/c/c2/WALL-Eposter.jpg",
  "Tangled": "https://upload.wikimedia.org/wikipedia/en/a/a8/Tangled_poster.jpg",
  "Gladiator": "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
  "The Martian": "https://upload.wikimedia.org/wikipedia/en/7/71/The_Martian_film_poster.jpg",
  "Gravity": "https://upload.wikimedia.org/wikipedia/en/f/f6/Gravity_Poster.jpg",
  "Arrival": "https://upload.wikimedia.org/wikipedia/en/d/df/Arrival%2C_Movie_Poster.jpg",
  "Tenet": "https://upload.wikimedia.org/wikipedia/en/1/14/Tenet_movie_poster.jpg"
};

// Generates an instant, zero-latency authentic movie-branded SVG poster
function generateCinematicPoster(title, year, genres, director) {
  const safeTitle = (title || 'Movie').replace(/[<>&"]/g, '');
  const safeYear = year ? String(year) : '';
  const safeGenre = Array.isArray(genres) && genres.length > 0 ? genres[0] : 'Feature Film';
  const safeDirector = director && director !== 'Unknown' ? `Directed by ${director}` : '';

  let gradient1 = '#0f172a';
  let gradient2 = '#1e1b4b';
  let accent = '#818cf8';

  if (safeGenre.includes('Action') || safeGenre.includes('Adventure')) {
    gradient2 = '#31102e';
    accent = '#f43f5e';
  } else if (safeGenre.includes('Sci-Fi') || safeGenre.includes('Science Fiction')) {
    gradient2 = '#083344';
    accent = '#38bdf8';
  } else if (safeGenre.includes('Horror') || safeGenre.includes('Thriller')) {
    gradient2 = '#1c1917';
    accent = '#ef4444';
  } else if (safeGenre.includes('Animation') || safeGenre.includes('Family')) {
    gradient2 = '#2e1065';
    accent = '#a855f7';
  } else if (safeGenre.includes('Romance')) {
    gradient2 = '#4c0519';
    accent = '#fb7185';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750" width="500" height="750">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradient1}" />
        <stop offset="100%" stop-color="${gradient2}" />
      </linearGradient>
      <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="transparent" />
        <stop offset="60%" stop-color="rgba(2,6,23,0.4)" />
        <stop offset="100%" stop-color="rgba(2,6,23,0.95)" />
      </linearGradient>
    </defs>
    <rect width="500" height="750" fill="url(#bg)" />
    
    <rect x="20" y="20" width="460" height="710" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" rx="12" />
    <circle cx="250" cy="220" r="110" fill="rgba(255,255,255,0.03)" />
    <circle cx="250" cy="220" r="70" fill="none" stroke="${accent}" stroke-width="2" opacity="0.4" stroke-dasharray="6,6" />
    
    <path d="M 220 190 L 280 190 L 280 250 L 220 250 Z" fill="none" stroke="${accent}" stroke-width="3" rx="4" opacity="0.8" />
    <polygon points="238,205 238,235 265,220" fill="${accent}" opacity="0.9" />

    <rect width="500" height="750" fill="url(#overlay)" />

    <rect x="40" y="520" width="auto" height="26" rx="6" fill="rgba(255,255,255,0.1)" />
    <text x="45" y="538" fill="${accent}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" letter-spacing="1.5">${safeGenre.toUpperCase()} • ${safeYear}</text>

    <text x="40" y="590" fill="#ffffff" font-family="'Helvetica Neue', Arial, sans-serif" font-size="32" font-weight="900" letter-spacing="-0.5">${safeTitle.length > 22 ? safeTitle.substring(0, 20) + '...' : safeTitle}</text>
    
    <text x="40" y="625" fill="#94a3b8" font-family="Arial, sans-serif" font-size="14" font-weight="500">${safeDirector}</text>
    
    <text x="40" y="690" fill="rgba(255,255,255,0.4)" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">CINEMATCH AI • OFFICIAL SELECTION</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Resolves authentic movie poster URL instantly (0ms latency)
function getMoviePoster(title, year, genres, director) {
  if (!title) return generateCinematicPoster('Movie', year, genres, director);

  const cleanTitle = title.trim();

  // 1. Check curated high-definition posters (0ms)
  if (CURATED_POSTERS[cleanTitle]) {
    return CURATED_POSTERS[cleanTitle];
  }

  // 2. Check local disk/memory cache (0ms)
  if (posterCache[cleanTitle]) {
    return posterCache[cleanTitle];
  }

  // 3. Fallback to instant Movie-Branded Cinema Poster (0ms)
  return generateCinematicPoster(cleanTitle, year, genres, director);
}

module.exports = {
  getMoviePoster,
  generateCinematicPoster,
  CURATED_POSTERS
};
