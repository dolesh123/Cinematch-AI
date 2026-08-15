import os
import json
import pandas as pd
import numpy as np

BASE_ML_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_ML_DIR, "datasets")
MOVIES_CSV = os.path.join(DATASETS_DIR, "tmdb_5000_movies.csv")
CREDITS_CSV = os.path.join(DATASETS_DIR, "tmdb_5000_credits.csv")

def parse_json_names(val):
    if not val or pd.isna(val):
        return []
    try:
        data = json.loads(val)
        if isinstance(data, list):
            return [item.get("name", "") for item in data if isinstance(item, dict) and item.get("name")]
    except Exception:
        pass
    return []

def parse_director(val):
    if not val or pd.isna(val):
        return ""
    try:
        data = json.loads(val)
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get("job") == "Director":
                    return item.get("name", "")
    except Exception:
        pass
    return ""

# Comprehensive Poster & backdrop mappings for top movies (100% Verified HTTP 200 OK)
POPULAR_POSTERS = {
    # Sci-Fi / Cyberpunk / Space
    "Avatar": ("https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"),
    "Inception": ("https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"),
    "Interstellar": ("https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"),
    "The Matrix": ("https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"),
    "Blade Runner": ("https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"),
    "Star Wars": ("https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"),
    "Jurassic Park": ("https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop&q=80"),
    "Alien": ("https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"),
    "The Terminator": ("https://image.tmdb.org/t/p/w500/qvktm0BHcnmDpul4Hz01GIazWPr.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"),

    # Superhero & Action
    "The Dark Knight": ("https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"),
    "The Dark Knight Rises": ("https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"),
    "The Avengers": ("https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"),
    "Iron Man": ("https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"),
    "Spider-Man": ("https://image.tmdb.org/t/p/w500/rweIrveL43TaxUN0akQEaAXL6x0.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"),
    "Gladiator": ("https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"),

    # Classics / Drama / Crime
    "The Shawshank Redemption": ("https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"),
    "The Godfather": ("https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"),
    "Pulp Fiction": ("https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"),
    "Fight Club": ("https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"),
    "Forrest Gump": ("https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"),
    "GoodFellas": ("https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"),
    "Se7en": ("https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80"),
    "The Silence of the Lambs": ("https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg", "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80"),
    "Whiplash": ("https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"),
    "The Prestige": ("https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"),
    "Memento": ("https://image.tmdb.org/t/p/w500/yuNs09hvpHVU1cBTCAk9zxsL2oW.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"),
    "The Wolf of Wall Street": ("https://image.tmdb.org/t/p/w500/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80"),
    "Django Unchained": ("https://image.tmdb.org/t/p/w500/8kOWDBK6XlPUzckuHDo3wwVRFwt.jpg", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"),
    "Titanic": ("https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg", "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80"),

    # Animation / Family
    "Toy Story": ("https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"),
    "Up": ("https://image.tmdb.org/t/p/w500/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"),
    "The Lion King": ("https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"),
    "Coco": ("https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"),
    "Spirited Away": ("https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"),
    "Harry Potter and the Philosopher's Stone": ("https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80"),

    # Horror / Thriller
    "The Conjuring": ("https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg", "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80")
}

GENRE_POSTER_PALETTES = {
    "Horror": [
        ("https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80")
    ],
    "Science Fiction": [
        ("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"),
        ("https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200&auto=format&fit=crop&q=80"),
        ("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80")
    ],
    "Action": [
        ("https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=1200&auto=format&fit=crop&q=80")
    ],
    "Animation": [
        ("https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80"),
        ("https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80")
    ],
    "Romance": [
        ("https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80"),
        ("https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&auto=format&fit=crop&q=80")
    ],
    "Drama": [
        ("https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80"),
        ("https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80")
    ],
    "Comedy": [
        ("https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80"),
        ("https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80")
    ],
    "Thriller": [
        ("https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop&q=80")
    ],
    "Crime": [
        ("https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80")
    ],
    "Adventure": [
        ("https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80")
    ],
    "Fantasy": [
        ("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80")
    ]
}

def get_movie_images(m_id: int, title: str, genres: list):
    if title and title in POPULAR_POSTERS:
        return POPULAR_POSTERS[title]

    for g in genres:
        if g in GENRE_POSTER_PALETTES:
            palette = GENRE_POSTER_PALETTES[g]
            return palette[abs(int(m_id or 0)) % len(palette)]

    default_palette = GENRE_POSTER_PALETTES["Drama"]
    return default_palette[abs(int(m_id or 0)) % len(default_palette)]

def load_tmdb_5000_movies_df() -> pd.DataFrame:
    """
    Loads and merges tmdb_5000_movies.csv and tmdb_5000_credits.csv datasets into a single DataFrame.
    """
    if not os.path.exists(MOVIES_CSV) or not os.path.exists(CREDITS_CSV):
        return pd.DataFrame()

    try:
        df_movies = pd.read_csv(MOVIES_CSV)
        df_credits = pd.read_csv(CREDITS_CSV)
        df_credits.rename(columns={"movie_id": "id"}, inplace=True)
        
        merged_df = df_movies.merge(df_credits[["id", "cast", "crew"]], on="id", how="inner")
        
        # Deduplicate merged dataframe by movie id
        merged_df.drop_duplicates(subset=["id"], keep="first", inplace=True)
        
        seen_keys = set()
        records = []
        for _, row in merged_df.iterrows():
            m_id = int(row["id"])
            title = str(row.get("title", "")).strip() if pd.notnull(row.get("title")) else ""
            if not title:
                continue

            year = 2000
            rel_date = str(row.get("release_date", "")).strip()
            if len(rel_date) >= 4 and rel_date[:4].isdigit():
                year = int(rel_date[:4])

            # Deduplicate by normalized (title, year)
            norm_key = (title.lower(), year)
            if norm_key in seen_keys:
                continue
            seen_keys.add(norm_key)

            genres = parse_json_names(row.get("genres"))
            keywords = parse_json_names(row.get("keywords"))
            cast = parse_json_names(row.get("cast"))[:8]
            director = parse_director(row.get("crew"))
            
            overview = str(row.get("overview", "")).strip() if pd.notnull(row.get("overview")) else ""
            lang = str(row.get("original_language", "en")).upper()
                
            rating = float(row.get("vote_average", 7.0)) if pd.notnull(row.get("vote_average")) else 7.0
            vote_count = int(row.get("vote_count", 100)) if pd.notnull(row.get("vote_count")) else 100
            popularity = float(row.get("popularity", 10.0)) if pd.notnull(row.get("popularity")) else 10.0
            
            poster_url, backdrop_url = get_movie_images(m_id, title, genres)
            
            # Boost director (x3), cast (x2), and genres (x2) in text feature vector
            director_boost = f"{director} {director} {director}" if director else ""
            cast_boost = f"{' '.join(cast)} {' '.join(cast)}" if cast else ""
            genres_boost = f"{' '.join(genres)} {' '.join(genres)}" if genres else ""
            
            combined_text = f"{title} {title} {director_boost} {cast_boost} {genres_boost} {' '.join(keywords)} {overview}"
            
            records.append({
                "movie_id": m_id,
                "title": title,
                "year": year,
                "genres": genres,
                "director": director,
                "cast": cast,
                "keywords": keywords,
                "overview": overview,
                "language": lang,
                "rating": rating,
                "vote_count": vote_count,
                "popularity": popularity,
                "poster_path": poster_url,
                "backdrop_path": backdrop_url,
                "combined_text": combined_text
            })
            
        df_res = pd.DataFrame(records)
        df_res.drop_duplicates(subset=["movie_id"], keep="first", inplace=True)
        return df_res
    except Exception as e:
        print(f"Error loading TMDB 5000 dataset: {e}")
        return pd.DataFrame()


def build_single_unified_dataset(db) -> pd.DataFrame:
    """
    Combines Movie metadata collection and User Interaction/Preference collections into a single unified DataFrame.
    """
    movies = list(db.movies.find({}))
    if not movies:
        return pd.DataFrame()

    movie_records = {}
    for m in movies:
        m_id = int(m.get("id", m.get("_id", 0)))
        genres_list = m.get("genres", [])
        if not isinstance(genres_list, list):
            genres_list = []
        cast_list = m.get("cast_members", [])
        if not isinstance(cast_list, list):
            cast_list = []
        keywords_list = m.get("keywords", [])
        if not isinstance(keywords_list, list):
            keywords_list = []
        vibes_list = m.get("emotional_vibes", [])
        if not isinstance(vibes_list, list):
            vibes_list = []
        
        genres_str = " ".join(genres_list)
        cast_str = " ".join(cast_list)
        keywords_str = " ".join(keywords_list)
        vibes_str = " ".join(vibes_list)
        
        combined_text = (
            f"{m.get('title', '')} {m.get('director', '')} {m.get('language', '')} "
            f"{genres_str} {genres_str} "
            f"{cast_str} {keywords_str} {vibes_str} {vibes_str} "
            f"{m.get('overview', '')}"
        )
        movie_records[m_id] = {
            "movie_id": m_id,
            "title": m.get("title", ""),
            "year": int(m.get("year", 2000)),
            "genres": genres_list,
            "director": m.get("director", "Unknown"),
            "cast": cast_list,
            "keywords": keywords_list,
            "vibes": vibes_list,
            "overview": m.get("overview", ""),
            "language": m.get("language", "English"),
            "rating": float(m.get("rating", 7.0)),
            "popularity": float(m.get("popularity", 10.0)),
            "movie_text": combined_text
        }

    ratings = list(db.ratings.find({}))
    interactions = list(db.user_interactions.find({}))
    preferences = list(db.user_preferences.find({}))
    
    user_pref_map = {}
    for p in preferences:
        u_id = int(p.get("user_id", 0))
        p_genres = p.get("preferred_genres", [])
        p_langs = p.get("preferred_languages", [])
        p_favs = p.get("favorite_movies", [])
        user_pref_map[u_id] = {
            "preferred_genres": p_genres if isinstance(p_genres, list) else [],
            "preferred_languages": p_langs if isinstance(p_langs, list) else [],
            "favorite_movies": p_favs if isinstance(p_favs, list) else []
        }

    unified_records = []
    
    for r in ratings:
        m_id = int(r.get("movie_id", 0))
        u_id = int(r.get("user_id", 0))
        if m_id in movie_records:
            m_info = movie_records[m_id]
            u_pref = user_pref_map.get(u_id, {})
            p_genres = " ".join(u_pref.get("preferred_genres", []))
            
            user_movie_combined = f"UserPref: {p_genres} Movie: {m_info['movie_text']}"
            
            unified_records.append({
                "user_id": u_id,
                "movie_id": m_id,
                "interaction_weight": float(r.get("rating", 7.0)),
                "interaction_type": "RATING",
                "user_preferred_genres": u_pref.get("preferred_genres", []),
                "title": m_info["title"],
                "genres": m_info["genres"],
                "director": m_info["director"],
                "overview": m_info["overview"],
                "rating": m_info["rating"],
                "popularity": m_info["popularity"],
                "combined_text": user_movie_combined
            })

    w_map = {
        "LIKE": 8.5,
        "DISLIKE": 2.0,
        "WATCHLIST": 7.5,
        "VIEW_DETAILS": 6.0,
        "NOT_INTERESTED": 1.0
    }
    for i in interactions:
        m_id = int(i.get("movie_id", 0))
        u_id = int(i.get("user_id", 0))
        i_type = str(i.get("interaction_type", "LIKE"))
        if m_id in movie_records:
            m_info = movie_records[m_id]
            u_pref = user_pref_map.get(u_id, {})
            p_genres = " ".join(u_pref.get("preferred_genres", []))
            
            user_movie_combined = f"UserPref: {p_genres} Movie: {m_info['movie_text']}"
            
            unified_records.append({
                "user_id": u_id,
                "movie_id": m_id,
                "interaction_weight": w_map.get(i_type, 5.0),
                "interaction_type": i_type,
                "user_preferred_genres": u_pref.get("preferred_genres", []),
                "title": m_info["title"],
                "genres": m_info["genres"],
                "director": m_info["director"],
                "overview": m_info["overview"],
                "rating": m_info["rating"],
                "popularity": m_info["popularity"],
                "combined_text": user_movie_combined
            })

    for m_id, m_info in movie_records.items():
        unified_records.append({
            "user_id": 0,
            "movie_id": m_id,
            "interaction_weight": float(m_info["rating"]),
            "interaction_type": "CATALOG",
            "user_preferred_genres": [],
            "title": m_info["title"],
            "genres": m_info["genres"],
            "director": m_info["director"],
            "overview": m_info["overview"],
            "rating": m_info["rating"],
            "popularity": m_info["popularity"],
            "combined_text": m_info["movie_text"]
        })

    unified_df = pd.DataFrame(unified_records)
    return unified_df
