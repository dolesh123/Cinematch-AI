import os
import random
from datetime import datetime, timezone
from database import get_database
from security import hash_password
from ml.unified_dataset import load_tmdb_5000_movies_df, get_movie_images

def seed_database():
    db = get_database()

    try:
        # 1. Insert Movies from clean deduplicated TMDB 5000 dataset into MongoDB
        existing_movies = db.movies.count_documents({})
        if existing_movies < 1000:
            df_tmdb = load_tmdb_5000_movies_df()
            if not df_tmdb.empty:
                print("Seeding clean, deduplicated TMDB 5000 dataset movies into MongoDB...")
                db.movies.delete_many({})
                
                movie_docs = []
                added_ids = set()
                for _, row in df_tmdb.iterrows():
                    m_id = int(row["movie_id"])
                    if m_id in added_ids:
                        continue
                    
                    title_str = str(row["title"])
                    genres_list = list(row["genres"]) if isinstance(row["genres"], list) else []
                    poster_url, backdrop_url = get_movie_images(m_id, title_str, genres_list)

                    doc = {
                        "id": m_id,
                        "title": title_str,
                        "year": int(row["year"]),
                        "genres": genres_list,
                        "language": str(row["language"]),
                        "rating": float(row["rating"]),
                        "vote_count": int(row["vote_count"]),
                        "overview": str(row["overview"]),
                        "poster_path": poster_url,
                        "backdrop_path": backdrop_url,
                        "director": str(row["director"]),
                        "cast_members": list(row["cast"]) if isinstance(row["cast"], list) else [],
                        "keywords": list(row["keywords"]) if isinstance(row["keywords"], list) else [],
                        "popularity": float(row["popularity"]),
                        "emotional_vibes": ["engaging", "popular"]
                    }
                    movie_docs.append(doc)
                    added_ids.add(m_id)

                if movie_docs:
                    db.movies.insert_many(movie_docs)
                    print(f"Total clean seeded MongoDB movies: {len(movie_docs)}.")

        # 2. Insert Demo Users & Preferences into MongoDB
        existing_users = db.users.count_documents({})
        if existing_users == 0:
            print("Seeding demo users & preferences into MongoDB...")
            
            users_to_add = [
                {
                    "id": 1,
                    "name": "Alex Vance (Sci-Fi Fan)",
                    "email": "scifi_user@cinematch.ai",
                    "password_hash": hash_password("password123"),
                    "is_admin": False,
                    "created_at": datetime.now(timezone.utc)
                },
                {
                    "id": 2,
                    "name": "Sophia Rose (Romance Fan)",
                    "email": "romance_user@cinematch.ai",
                    "password_hash": hash_password("password123"),
                    "is_admin": False,
                    "created_at": datetime.now(timezone.utc)
                },
                {
                    "id": 3,
                    "name": "Leo Das (Animation Fan)",
                    "email": "animation_user@cinematch.ai",
                    "password_hash": hash_password("password123"),
                    "is_admin": False,
                    "created_at": datetime.now(timezone.utc)
                },
                {
                    "id": 4,
                    "name": "Admin",
                    "email": "admin@cinematch.ai",
                    "password_hash": hash_password("admin123"),
                    "is_admin": True,
                    "created_at": datetime.now(timezone.utc)
                }
            ]
            db.users.insert_many(users_to_add)

            # Preferences
            prefs_to_add = [
                {
                    "id": 1,
                    "user_id": 1,
                    "preferred_genres": ["Sci-Fi", "Thriller", "Mystery"],
                    "preferred_languages": ["English"],
                    "min_rating": 7.5,
                    "max_rating": 10.0,
                    "discovery_slider": 0.4,
                    "preferred_era": ["2010-2020", "2020+"],
                    "favorite_movies": [157336, 27205, 286217, 78],
                    "onboarding_completed": True,
                    "updated_at": datetime.now(timezone.utc)
                },
                {
                    "id": 2,
                    "user_id": 2,
                    "preferred_genres": ["Romance", "Drama"],
                    "preferred_languages": ["English"],
                    "min_rating": 7.0,
                    "max_rating": 10.0,
                    "discovery_slider": 0.5,
                    "preferred_era": ["1980-2000", "2000-2010", "2010-2020"],
                    "favorite_movies": [597, 11036, 4348, 122906],
                    "onboarding_completed": True,
                    "updated_at": datetime.now(timezone.utc)
                },
                {
                    "id": 3,
                    "user_id": 3,
                    "preferred_genres": ["Animation", "Family", "Adventure"],
                    "preferred_languages": ["English"],
                    "min_rating": 7.0,
                    "max_rating": 10.0,
                    "discovery_slider": 0.3,
                    "preferred_era": ["2000-2010", "2010-2020", "2020+"],
                    "favorite_movies": [12, 10681, 14160, 38757],
                    "onboarding_completed": True,
                    "updated_at": datetime.now(timezone.utc)
                },
                {
                    "id": 4,
                    "user_id": 4,
                    "preferred_genres": ["Action", "Sci-Fi", "Crime", "Drama"],
                    "preferred_languages": ["English"],
                    "min_rating": 6.5,
                    "max_rating": 10.0,
                    "discovery_slider": 0.5,
                    "preferred_era": [],
                    "favorite_movies": [27205, 155, 157336, 680],
                    "onboarding_completed": True,
                    "updated_at": datetime.now(timezone.utc)
                }
            ]
            db.user_preferences.insert_many(prefs_to_add)

            # Sample Ratings & Interactions
            ratings_to_add = [
                {"user_id": 1, "movie_id": 157336, "rating": 9.5, "created_at": datetime.now(timezone.utc)},
                {"user_id": 1, "movie_id": 27205, "rating": 9.0, "created_at": datetime.now(timezone.utc)},
                {"user_id": 1, "movie_id": 286217, "rating": 8.5, "created_at": datetime.now(timezone.utc)},
                {"user_id": 1, "movie_id": 78, "rating": 9.0, "created_at": datetime.now(timezone.utc)},
                {"user_id": 2, "movie_id": 597, "rating": 9.0, "created_at": datetime.now(timezone.utc)},
                {"user_id": 2, "movie_id": 11036, "rating": 8.8, "created_at": datetime.now(timezone.utc)},
                {"user_id": 3, "movie_id": 12, "rating": 9.2, "created_at": datetime.now(timezone.utc)},
                {"user_id": 3, "movie_id": 10681, "rating": 9.0, "created_at": datetime.now(timezone.utc)},
            ]
            db.ratings.insert_many(ratings_to_add)

            interactions_to_add = [
                {"user_id": 1, "movie_id": 157336, "interaction_type": "LIKE", "weight": 1.0, "timestamp": datetime.now(timezone.utc)},
                {"user_id": 1, "movie_id": 27205, "interaction_type": "LIKE", "weight": 1.0, "timestamp": datetime.now(timezone.utc)},
                {"user_id": 1, "movie_id": 603, "interaction_type": "CLICK", "weight": 0.2, "timestamp": datetime.now(timezone.utc)},
                {"user_id": 2, "movie_id": 597, "interaction_type": "LIKE", "weight": 1.0, "timestamp": datetime.now(timezone.utc)},
                {"user_id": 2, "movie_id": 11036, "interaction_type": "LIKE", "weight": 1.0, "timestamp": datetime.now(timezone.utc)},
                {"user_id": 3, "movie_id": 12, "interaction_type": "LIKE", "weight": 1.0, "timestamp": datetime.now(timezone.utc)},
            ]
            db.user_interactions.insert_many(interactions_to_add)

            # Sample watchlists
            watchlist_to_add = [
                {"user_id": 1, "movie_id": 603, "is_watched": False, "added_at": datetime.now(timezone.utc)},
                {"user_id": 2, "movie_id": 4348, "is_watched": False, "added_at": datetime.now(timezone.utc)},
                {"user_id": 3, "movie_id": 38757, "is_watched": False, "added_at": datetime.now(timezone.utc)},
            ]
            db.watchlists.insert_many(watchlist_to_add)

            print("Successfully seeded MongoDB users, ratings, and interaction history!")

    except Exception as e:
        print(f"Error seeding MongoDB database: {e}")

if __name__ == "__main__":
    seed_database()
