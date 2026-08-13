import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from models import Movie

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models")

class ContentBasedRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
        self.tfidf_matrix = None
        self.movie_df = None
        self.movie_id_to_idx = {}
        self.idx_to_movie_id = {}

    def fit_or_load(self, db: Session, force_retrain: bool = False):
        os.makedirs(MODEL_DIR, exist_ok=True)
        vectorizer_path = os.path.join(MODEL_DIR, "content_vectorizer.pkl")
        matrix_path = os.path.join(MODEL_DIR, "content_matrix.pkl")
        df_path = os.path.join(MODEL_DIR, "movie_index.pkl")

        if not force_retrain and os.path.exists(vectorizer_path) and os.path.exists(matrix_path) and os.path.exists(df_path):
            try:
                self.vectorizer = joblib.load(vectorizer_path)
                self.tfidf_matrix = joblib.load(matrix_path)
                self.movie_df = joblib.load(df_path)
                self._build_index_maps()
                return
            except Exception as e:
                print(f"Error loading content models: {e}. Retraining...")

        self.retrain(db)

    def retrain(self, db: Session):
        movies = db.query(Movie).all()
        if not movies:
            return

        data = []
        for m in movies:
            genres_str = " ".join(json.loads(m.genres or "[]"))
            cast_str = " ".join(json.loads(m.cast_members or "[]"))
            keywords_str = " ".join(json.loads(m.keywords or "[]"))
            vibes_str = " ".join(json.loads(m.emotional_vibes or "[]"))

            combined_text = (
                f"{m.title} {m.director} {m.language} "
                f"{genres_str} {genres_str} "  # Boost genre weight
                f"{cast_str} {keywords_str} {vibes_str} {vibes_str} "  # Boost vibes
                f"{m.overview}"
            )
            data.append({
                "movie_id": m.id,
                "title": m.title,
                "year": m.year,
                "combined_text": combined_text,
                "genres": json.loads(m.genres or "[]"),
                "language": m.language,
                "rating": m.rating,
                "popularity": m.popularity
            })

        self.movie_df = pd.DataFrame(data)
        self._build_index_maps()

        self.tfidf_matrix = self.vectorizer.fit_transform(self.movie_df["combined_text"])

        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(self.vectorizer, os.path.join(MODEL_DIR, "content_vectorizer.pkl"))
        joblib.dump(self.tfidf_matrix, os.path.join(MODEL_DIR, "content_matrix.pkl"))
        joblib.dump(self.movie_df, os.path.join(MODEL_DIR, "movie_index.pkl"))
        print("Content-based TF-IDF recommender retrained successfully!")

    def _build_index_maps(self):
        self.movie_id_to_idx = {row["movie_id"]: idx for idx, row in self.movie_df.iterrows()}
        self.idx_to_movie_id = {idx: row["movie_id"] for idx, row in self.movie_df.iterrows()}

    def get_content_similarity(self, movie_id: int, candidate_ids: list) -> dict:
        if self.tfidf_matrix is None or movie_id not in self.movie_id_to_idx:
            return {c_id: 0.5 for c_id in candidate_ids}

        target_idx = self.movie_id_to_idx[movie_id]
        target_vec = self.tfidf_matrix[target_idx]

        candidate_indices = [self.movie_id_to_idx[c_id] for c_id in candidate_ids if c_id in self.movie_id_to_idx]
        if not candidate_indices:
            return {c_id: 0.5 for c_id in candidate_ids}

        cand_vectors = self.tfidf_matrix[candidate_indices]
        sims = cosine_similarity(target_vec, cand_vectors).flatten()

        result = {}
        for c_id, sim in zip(candidate_ids, sims):
            result[c_id] = float(sim)
        return result

    def get_query_text_similarity(self, text_query: str, candidate_ids: list) -> dict:
        if self.tfidf_matrix is None or not text_query:
            return {c_id: 0.5 for c_id in candidate_ids}

        query_vec = self.vectorizer.transform([text_query])
        candidate_indices = [self.movie_id_to_idx[c_id] for c_id in candidate_ids if c_id in self.movie_id_to_idx]
        if not candidate_indices:
            return {c_id: 0.5 for c_id in candidate_ids}

        cand_vectors = self.tfidf_matrix[candidate_indices]
        sims = cosine_similarity(query_vec, cand_vectors).flatten()

        return {c_id: float(sim) for c_id, sim in zip(candidate_ids, sims)}
