# CineMatch AI 🎬🤖

**CineMatch AI** is a state-of-the-art, multi-user personalized movie recommendation platform. It features a hybrid recommendation engine powered by machine learning, real-time user taste profiling, and a natural language mood parser driven by Google's Gemini AI.

---

## 🌟 Key Features

* **Hybrid Recommendation Engine:**
  * **Content-Based Filtering:** TF-IDF vectorization and cosine similarity over genres, plot overviews, directors, keywords, and cast.
  * **Collaborative Filtering:** User-Item matrix factorization and peer user rating similarities.
  * **Hybrid Fusion:** Combines content, collaborative, recency, and popularity signals to deliver hyper-personalized movie feeds.

* **Gemini AI Natural Language Mood Search:**
  * Parses complex natural language requests (e.g., *"I want an intense, mind-bending sci-fi thriller for a late-night session"*) using Google's `google-genai` SDK (`gemini-2.5-flash`).
  * Extracts target genres, vibes, sentiment, and AI-generated match rationales.
  * Includes a built-in heuristic NLP parser fallback if the API key is unavailable.

* **Multi-User Isolation & Security:**
  * Secure JWT-based authentication (`PyJWT`) with `bcrypt` password hashing.
  * Strict user data isolation ensures preferences, ratings, watchlists, and recommendation histories are kept isolated per account.

* **Real-time Taste Profiling & Watchlist:**
  * Dynamic user preference sliders (genres, era, tone).
  * Interactive rating system and single-click watchlist toggle.
  * Instant re-ranking of recommended titles based on real-time feedback.

* **Admin Analytics & Model Evaluation:**
  * Automated metric evaluation calculating Precision@K, Recall@K, Catalog Coverage, and Recommendation Diversity.
  * Admin dashboard endpoints for system-wide analytics.

* **Modern Responsive Interface:**
  * Built with React 19, TypeScript, Vite, TailwindCSS, and Lucide icons.

---

## 🏗️ Architecture & Technology Stack

### **Backend**
* **Framework:** FastAPI (Python 3.14)
* **Database & ORM:** SQLite + SQLAlchemy 2.0
* **Machine Learning:** Scikit-Learn, Pandas, NumPy, Joblib
* **Generative AI:** Google GenAI SDK (`google-genai`)
* **Authentication:** PyJWT, Passlib, Bcrypt
* **Testing:** Pytest, HTTPX

### **Frontend**
* **Framework:** React 19 + Vite
* **Language:** TypeScript
* **Styling:** TailwindCSS 4
* **HTTP Client:** Axios
* **Icons:** Lucide React

---

## 📁 Directory Structure

```
cinematch-ai/
├── backend/
│   ├── main.py                  # FastAPI application & REST endpoints
│   ├── database.py              # SQLAlchemy database setup
│   ├── models.py                # Database models (User, Movie, Rating, etc.)
│   ├── schemas.py               # Pydantic schemas & validation
│   ├── security.py              # JWT authentication & password hashing
│   ├── seed_data.py             # Database seed script
│   ├── ml/
│   │   ├── hybrid_engine.py     # Main Hybrid Recommendation Algorithm
│   │   ├── content_recommender.py # TF-IDF & Cosine Similarity
│   │   ├── collaborative_recommender.py # Collaborative Filtering
│   │   ├── llm_recommender.py   # Gemini AI Mood Parser
  │   ├── evaluation.py        # Model performance metrics
  │   └── tmdb_client.py       # TMDB API integration
  └── tests/
      └── test_multi_user_isolation.py # Multi-user isolation test suite
├── frontend/                    # React + Vite TypeScript App
├── run_backend.bat              # Script to start FastAPI server
├── run_frontend.bat             # Script to start Vite dev server
└── README.md                    # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python 3.10+** (Python 3.14 supported)
* **Node.js 18+** & `npm`

---

### Step 1: Clone & Setup Virtual Environment

```bash
git clone https://github.com/dolesh123/Cinematch-AI.git
cd Cinematch-AI
```

If the `venv` is not already initialized, create and install dependencies:

```powershell
python -m venv venv
.\venv\Scripts\pip install -r backend\requirements.txt
```

---

### Step 2: (Optional) Set Gemini API Key

To enable Google Gemini AI natural language mood search, set your API key:

**PowerShell:**
```powershell
$env:GEMINI_API_KEY="your_actual_gemini_api_key"
```

**Command Prompt (cmd):**
```cmd
set GEMINI_API_KEY=your_actual_gemini_api_key
```

---

### Step 3: Run the Application

#### **Method A: Using Quick Launch Scripts (Windows)**

Open two terminal windows in the project root:

1. **Terminal 1 (Backend):**
   ```cmd
   .\run_backend.bat
   ```
   *FastAPI server starts at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).*

2. **Terminal 2 (Frontend):**
   ```cmd
   .\run_frontend.bat
   ```
   *React dev server starts at `http://localhost:5173`.*

---

#### **Method B: Manual Startup**

1. **Start Backend Server:**
   ```powershell
   $env:PYTHONPATH="backend"
   .\venv\Scripts\uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Frontend Dev Server:**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

---

## 🧪 Running Tests

To run the automated test suite verifying multi-user data isolation and backend logic:

```powershell
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest backend
```

---

## 📄 License

This project is licensed under the MIT License.
