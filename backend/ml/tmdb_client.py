import os
import json
import httpx
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models import Movie

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")  # TMDB API Key (e.g. v3 api key)
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
    80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
    14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
    53: "Thriller", 10752: "War", 37: "Western"
}

class TMDBClient:
    def __init__(self, api_key: str = TMDB_API_KEY):
        self.api_key = api_key
        self.client = httpx.Client(timeout=10.0)

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def search_movies_online(self, query: str) -> List[Dict[str, Any]]:
        if not self.is_configured() or not query:
            return []

        try:
            res = self.client.get(
                f"{TMDB_BASE_URL}/search/movie",
                params={"api_key": self.api_key, "query": query, "include_adult": False}
            )
            if res.status_code == 200:
                data = res.json()
                return [self._format_tmdb_movie(m) for m in data.get("results", [])]
        except Exception as e:
            print(f"TMDB API Search Error: {e}")
        return []

    def get_trending_movies_online(self) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []

        try:
            res = self.client.get(
                f"{TMDB_BASE_URL}/trending/movie/week",
                params={"api_key": self.api_key}
            )
            if res.status_code == 200:
                data = res.json()
                return [self._format_tmdb_movie(m) for m in data.get("results", [])]
        except Exception as e:
            print(f"TMDB API Trending Error: {e}")
        return []

    def sync_tmdb_movie_to_db(self, tmdb_data: Dict[str, Any], db: Session) -> Movie:
        existing = db.query(Movie).filter(Movie.id == tmdb_data["id"]).first()
        if existing:
            return existing

        genres_json = json.dumps(tmdb_data.get("genres", []))
        cast_json = json.dumps(tmdb_data.get("cast_members", []))
        keywords_json = json.dumps(tmdb_data.get("keywords", []))
        vibes_json = json.dumps(tmdb_data.get("emotional_vibes", []))

        movie = Movie(
            id=tmdb_data["id"],
            title=tmdb_data["title"],
            year=tmdb_data["year"],
            genres=genres_json,
            language=tmdb_data.get("language", "English"),
            rating=tmdb_data.get("rating", 7.0),
            vote_count=tmdb_data.get("vote_count", 100),
            overview=tmdb_data.get("overview", ""),
            poster_path=tmdb_data.get("poster_path"),
            backdrop_path=tmdb_data.get("backdrop_path"),
            director=tmdb_data.get("director", "Unknown"),
            cast_members=cast_json,
            keywords=keywords_json,
            popularity=tmdb_data.get("popularity", 50.0),
            emotional_vibes=vibes_json
        )
        db.add(movie)
        db.commit()
        db.refresh(movie)
        return movie

    def _format_tmdb_movie(self, item: Dict[str, Any]) -> Dict[str, Any]:
        genre_ids = item.get("genre_ids", [])
        genres = [GENRE_MAP.get(gid, "Drama") for gid in genre_ids if gid in GENRE_MAP]
        if not genres:
            genres = ["Drama"]

        poster = f"{TMDB_IMAGE_BASE}{item.get('poster_path')}" if item.get('poster_path') else None
        backdrop = f"{TMDB_IMAGE_BASE}{item.get('backdrop_path')}" if item.get('backdrop_path') else None

        release_date = item.get("release_date", "2020-01-01")
        year = int(release_date.split("-")[0]) if release_date and "-" in release_date else 2020

        return {
            "id": item["id"],
            "title": item["title"],
            "year": year,
            "genres": genres,
            "language": item.get("original_language", "en").upper(),
            "rating": round(item.get("vote_average", 7.0), 1),
            "vote_count": item.get("vote_count", 500),
            "overview": item.get("overview", ""),
            "poster_path": poster,
            "backdrop_path": backdrop,
            "director": "TMDB Director",
            "cast_members": ["TMDB Cast"],
            "keywords": genres,
            "popularity": item.get("popularity", 50.0),
            "emotional_vibes": [g.lower() for g in genres]
        }
