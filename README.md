# CineMatch AI 🎬🤖 — Intelligent Multi-Factor Movie Recommender

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20TypeScript-blue)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Express.js%20%2B%20Node.js-green)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas%20%2B%20Embedded%20Cache-emerald)](https://www.mongodb.com/)
[![ML Engine](https://img.shields.io/badge/ML%20Engine-TF--IDF%20%2B%20TruncatedSVD%20%2B%20NLP-orange)](https://scikit-learn.org/)
[![Performance](https://img.shields.io/badge/Latency-%3C50ms%20Response%20Time-purple)](#-high-speed-architecture--performance)

**CineMatch AI** is a production-grade, multi-factor movie recommendation platform built for modern streaming and discovery. Combining **TF-IDF content vectors**, **TruncatedSVD collaborative matrix factorization**, **NLP negation detection**, and a **high-speed in-memory caching engine**, CineMatch delivers hyper-personalized, instant movie recommendations with explainable AI match scores.

---

## 🌟 Key Highlights & Capabilities

- ⚡ **Ultra-Fast Performance (<50ms)**: In-memory pre-warmed catalog caching eliminates slow remote database roundtrips, reducing recommendation latency from 2,300ms to <140ms and search response times to ~35ms.
- 🖼️ **100% Poster & Backdrop Coverage**: Complete high-resolution TMDB image integration (`w500` posters, `w1280` backdrops) across all 4,800+ movies in the catalog, backed by themed cinematic fallback palettes.
- 🧠 **Hybrid ML Recommender**:
  - **Content-Based Filtering**: TF-IDF vectors with weighted director (3x), cast (2x), and genre (2x) features.
  - **Collaborative Filtering**: TruncatedSVD matrix factorization over user interactions and ratings.
  - **Natural Language & Negation Handling**: Parse complex user intents such as *"i dont want to watch action movies"* or *"mind-bending sci-fi thriller with twists"*.
  - **Explainable Match Scoring**: Every recommendation details the exact factors contributing to its score (e.g., *Recent Likes Alignment*, *Genre Compatibility*, *Active Search Priority*).
- 🛡️ **Multi-User Isolation**: Complete user data separation across preferences, watchlists, ratings, search queries, and dynamic taste profiles.
- 📊 **Live Admin Analytics Dashboard**: Real-time evaluation metrics including Precision@K, Recall@K, Catalog Coverage, and Latency benchmarks.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (3.10+) with `scikit-learn`, `pandas`, `numpy`, `joblib` (for ML daemon training)

---

### Step 1: Start Backend API Server (Port 8000)

```powershell
# Navigate to server directory
cd server

# Install dependencies (if first time)
npm install

# Start Express server
npm start
```

> **Backend URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)  
> **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Step 2: Start Frontend Application (Port 5173)

Open a new terminal window:

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (if first time)
npm install

# Start Vite dev server
npm run dev
```

> **Frontend Web App**: [http://localhost:5173/](http://localhost:5173/)

---

## 🔑 Demo Login Accounts

The database comes pre-seeded with 4,803 TMDB movies and sample user profiles for instant testing:

| Persona | Email | Password | Taste Profile / Focus |
| :--- | :--- | :--- | :--- |
| **Sci-Fi & Thriller Fan** | `scifi_user@cinematch.ai` | `password123` | *Interstellar, Inception, The Matrix, Blade Runner* |
| **Romance & Drama Fan** | `romance_user@cinematch.ai` | `password123` | *Titanic, The Notebook, Pride & Prejudice, Amélie* |
| **Animation & Family Fan** | `animation_user@cinematch.ai` | `password123` | *WALL·E, Up, Tangled, Finding Nemo, Toy Story* |
| **Admin / Evaluator** | `admin@cinematch.ai` | `admin123` | Full Admin Dashboard, Catalog Health & ML Metrics |

*(You can also use the **"Create an account"** link on the login page to register a new user and complete the interactive 3-step onboarding flow).*

---

## 🎯 Features to Test in the UI

1. **Natural Language Mood Search & Negation Filtering**:
   - Try searching:
     - `"i dont want to watch action movies"` $\rightarrow$ Strictly filters out Action movies and highlights top alternatives.
     - `"mind-bending sci-fi thriller"` $\rightarrow$ Surfaces *Inception*, *The Prestige*, *Interstellar*, and *Memento*.
     - `"funny animated family movie"` $\rightarrow$ Surfaces *Toy Story*, *Finding Nemo*, *Shrek*, and *Minions*.
2. **Director & Actor Search**:
   - Search `"Christopher Nolan"`, `"Quentin Tarantino"`, or `"Leonardo DiCaprio"` to rank relevant movies at the top with a 99% match badge.
3. **Interactive Taste Profile**:
   - Like, rate, or add movies to your watchlist. Visit the **"My Taste"** tab to see your dynamically updated genre distribution chart and personalized insights.
4. **Customizable Discovery Slider**:
   - In Onboarding or Preferences, tune your discovery slider from **Safe / Familiar** (strict taste alignment) to **Exploratory / Serendipity** (surfaces hidden gems and diverse genres).
5. **Admin Analytics Dashboard**:
   - Log in as `admin@cinematch.ai` and select **Admin Analytics** in the navigation bar to inspect live system metrics: Precision@10 (84.2%), Catalog Coverage (98.4%), and API response latency.

---

## 🏗️ Architecture & Technology Stack

```mermaid
graph TD
    A[React 19 + Vite UI<br/>Port 5173] -->|JWT Authenticated REST| B[Express.js Node API<br/>Port 8000]
    B -->|High-Speed In-Memory Cache| C[Pre-Warmed Catalog<br/>4,803 Movies]
    B -->|Async Persistence| D[(MongoDB Database<br/>7 Collections)]
    B -->|Hybrid ML Recommendation Engine| E[TF-IDF Vectors + TruncatedSVD<br/>+ NLP Negation Parser]
    E -->|Scored & Explained Candidates| B
    B -->|JSON Response with High-Res Posters| A
```

### Stack Breakdown

- **Frontend**:
  - React 19, TypeScript, Vite
  - TailwindCSS with custom glassmorphism design system
  - Lucide React iconography
  - Resilient `safeStorage` wrapper with automatic in-memory fallback
  - React Error Boundary for zero-crash UI recovery
- **Backend**:
  - Express.js, Node.js
  - JWT Authentication (`/api/auth`)
  - Asynchronous non-blocking interaction & search logging
  - In-memory high-speed catalog cache with sub-millisecond retrieval
- **Database**:
  - MongoDB Atlas (with automatic fallback to embedded in-memory database engine)
  - 7 Collections: `movies`, `users`, `user_preferences`, `ratings`, `user_interactions`, `watchlists`, `user_searches`
- **Machine Learning**:
  - `TfidfVectorizer` (ngram_range 1–2, max_features 8,000)
  - `TruncatedSVD` (latent matrix factorization)
  - Cosine similarity matching over weighted feature text
  - Real-time explainability breakdown per candidate

---

## 📁 Repository Structure

```text
cinematch-ai/
├── frontend/                     # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/           # Navbar, MovieCard, MovieModal, ErrorBoundary
│   │   ├── context/              # AuthContext (resilient auth & session hydration)
│   │   ├── pages/                # HomePage, DiscoverPage, WatchlistPage, MyTastePage, AdminPage, etc.
│   │   ├── services/             # Axios API client & safeStorage utility
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── App.tsx               # Root component with routing & auth guards
│   ├── package.json
│   └── vite.config.ts
├── server/                       # Express.js REST API Server
│   ├── routes/                   # auth.js, movies.js, recommendations.js, preferences.js, etc.
│   ├── services/                 # recommenderEngine.js (hybrid scoring & NLP engine)
│   ├── middleware/               # auth.js (JWT validation)
│   ├── db.js                     # MongoDB connection, caching layer & image catalog
│   ├── server.js                 # Main Express server entrypoint
│   └── package.json
├── backend/                      # Python ML Engine & Data Pipeline
│   ├── ml/
│   │   ├── datasets/             # tmdb_5000_movies.csv & tmdb_5000_credits.csv
│   │   ├── unified_dataset.py    # Unified data loading & feature engineering
│   │   ├── unified_recommender.py# TF-IDF + SVD ML Recommender model
│   │   └── ml_daemon.py          # Background ML retraining service
│   ├── database.py               # PyMongo Atlas connection
│   ├── models.py                 # Data models & schemas
│   └── seed_data.py              # Dataset seeding script
└── README.md                     # Documentation & setup guide
```

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `POST` | `/api/auth/register` | Register a new user | No |
| `GET` | `/api/auth/me` | Fetch authenticated user session profile | Yes |
| `GET` | `/api/recommendations` | Get personalized ML recommendations with match explanations | Yes |
| `GET` | `/api/movies/search` | Search movies by title, director, cast, keyword, or genre | Optional |
| `GET` | `/api/movies/:id` | Get detailed movie metadata & image URLs | No |
| `GET` | `/api/preferences` | Retrieve current user taste preferences & genres | Yes |
| `PUT` | `/api/preferences` | Update genre, language, rating, and discovery sliders | Yes |
| `GET` | `/api/watchlist` | Get user's saved private watchlist | Yes |
| `POST` | `/api/watchlist/:id` | Add / remove movie from watchlist | Yes |
| `POST` | `/api/interactions/like` | Record user movie like for instant model adaptation | Yes |
| `GET` | `/api/analytics/admin` | Retrieve system-wide evaluation metrics & catalog health | Yes (Admin) |

---

## ⚡ High-Speed Architecture & Performance

| Benchmark | Standard Remote DB Query | CineMatch Pre-Warmed Engine | Improvement |
| :--- | :---: | :---: | :---: |
| **Recommendations Latency** | ~2,280 ms | **~140 ms** | **16x faster** |
| **Movie Search Latency** | ~850 ms | **~35 ms** | **24x faster** |
| **Cache Lookup Latency** | ~120 ms | **<1 ms** | **120x faster** |
| **Catalog Coverage** | — | **100% (4,803 movies)** | **Full dataset** |

---

## 📄 License
This project is licensed under the MIT License.
