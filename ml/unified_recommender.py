import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Any, Optional, List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
try:
    from ml.unified_dataset import build_single_unified_dataset
except ImportError:
    from unified_dataset import build_single_unified_dataset

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "trained_models"))
os.makedirs(MODEL_DIR, exist_ok=True)

class UnifiedRecommender:
    def __init__(self, n_svd_components: int = 10):
        self.vectorizer = TfidfVectorizer(stop_words="english", max_features=8000, ngram_range=(1, 2))
        self.tfidf_matrix = None
        self.unified_df = None
        self.svd = TruncatedSVD(n_components=n_svd_components, random_state=42)
        self.user_factors = None
        self.item_factors = None
        self.movie_id_to_idx = {}
        self.idx_to_movie_id = {}
        self.user_map = {}
        self.movie_map = {}

    def fit_or_load(self, db: Any, force_retrain: bool = False):
        os.makedirs(MODEL_DIR, exist_ok=True)
        model_path = os.path.join(MODEL_DIR, "unified_recommender_model.pkl")

        if not force_retrain and os.path.exists(model_path):
            try:
                bundle = joblib.load(model_path)
                self.vectorizer = bundle["vectorizer"]
                self.tfidf_matrix = bundle["tfidf_matrix"]
                self.unified_df = bundle["unified_df"]
                self.svd = bundle.get("svd", self.svd)
                self.user_factors = bundle.get("user_factors")
                self.item_factors = bundle.get("item_factors")
                self.user_map = bundle.get("user_map", {})
                self.movie_map = bundle.get("movie_map", {})
                self._build_index_maps()
                return
            except Exception as e:
                print(f"Error loading unified model: {e}. Retraining on single dataset...")

        self.retrain(db)

    def retrain(self, db: Any):
        print("Training Unified Model on single combined dataset...")
        self.unified_df = build_single_unified_dataset(db)
        if self.unified_df.empty:
            return

        # 1. Feature Extraction: Fit TF-IDF on combined_text of single unified dataset
        self.tfidf_matrix = self.vectorizer.fit_transform(self.unified_df["combined_text"])
        self._build_index_maps()

        # 2. Collaborative Interaction Feature Extraction on single dataset
        interaction_rows = self.unified_df[self.unified_df["user_id"] > 0]
        if not interaction_rows.empty:
            pivot = interaction_rows.pivot_table(
                index="user_id", columns="movie_id", values="interaction_weight", aggfunc="mean"
            ).fillna(5.0)

            self.user_map = {uid: idx for idx, uid in enumerate(pivot.index)}
            self.movie_map = {mid: idx for idx, mid in enumerate(pivot.columns)}
            matrix = pivot.values

            n_comp = min(10, matrix.shape[0] - 1, matrix.shape[1] - 1)
            n_comp = max(1, n_comp)

            self.svd = TruncatedSVD(n_components=n_comp, random_state=42)
            self.user_factors = self.svd.fit_transform(matrix)
            self.item_factors = self.svd.components_.T

        # Persist unified trained model bundle
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump({
            "vectorizer": self.vectorizer,
            "tfidf_matrix": self.tfidf_matrix,
            "unified_df": self.unified_df,
            "svd": self.svd,
            "user_factors": self.user_factors,
            "item_factors": self.item_factors,
            "user_map": self.user_map,
            "movie_map": self.movie_map
        }, os.path.join(MODEL_DIR, "unified_recommender_model.pkl"))
        
        print("Unified Recommender model trained successfully!")

    def _build_index_maps(self):
        if self.unified_df is None or self.unified_df.empty:
            return
        # Unique movie entries
        unique_movies = self.unified_df.drop_duplicates(subset=["movie_id"]).reset_index(drop=True)
        self.movie_id_to_idx = {row["movie_id"]: idx for idx, row in unique_movies.iterrows()}
        self.idx_to_movie_id = {idx: row["movie_id"] for idx, row in unique_movies.iterrows()}

    def get_content_similarity(self, movie_id: int, candidate_ids: list) -> dict:
        if self.tfidf_matrix is None or movie_id not in self.movie_id_to_idx:
            return {c_id: 0.5 for c_id in candidate_ids}

        target_idx = self.movie_id_to_idx[movie_id]
        target_vec = self.tfidf_matrix[target_idx]

        cand_indices = [self.movie_id_to_idx[c_id] for c_id in candidate_ids if c_id in self.movie_id_to_idx]
        if not cand_indices:
            return {c_id: 0.5 for c_id in candidate_ids}

        cand_vectors = self.tfidf_matrix[cand_indices]
        sims = cosine_similarity(target_vec, cand_vectors).flatten()

        res = {}
        for c_id, sim in zip([c_id for c_id in candidate_ids if c_id in self.movie_id_to_idx], sims):
            res[c_id] = float(sim)
        for c_id in candidate_ids:
            if c_id not in res:
                res[c_id] = 0.5
        return res

    def get_query_text_similarity(self, text_query: str, candidate_ids: list) -> dict:
        if self.tfidf_matrix is None or not text_query:
            return {c_id: 0.5 for c_id in candidate_ids}

        query_vec = self.vectorizer.transform([text_query])
        cand_indices = [self.movie_id_to_idx[c_id] for c_id in candidate_ids if c_id in self.movie_id_to_idx]
        if not cand_indices:
            return {c_id: 0.5 for c_id in candidate_ids}

        cand_vectors = self.tfidf_matrix[cand_indices]
        sims = cosine_similarity(query_vec, cand_vectors).flatten()

        res = {}
        for c_id, sim in zip([c_id for c_id in candidate_ids if c_id in self.movie_id_to_idx], sims):
            res[c_id] = float(sim)
        for c_id in candidate_ids:
            if c_id not in res:
                res[c_id] = 0.5
        return res

    def predict_collaborative_score(self, user_id: int, movie_id: int) -> float:
        if self.user_factors is None or user_id not in self.user_map or movie_id not in self.movie_map:
            return 0.5

        u_idx = self.user_map[user_id]
        m_idx = self.movie_map[movie_id]

        u_vec = self.user_factors[u_idx]
        m_vec = self.item_factors[m_idx]

        score = float(np.dot(u_vec, m_vec))
        norm_score = 1.0 / (1.0 + np.exp(-(score - 5.0) / 2.0))
        return norm_score

    def get_collaborative_scores(self, user_id: int, candidate_ids: list) -> dict:
        return {c_id: self.predict_collaborative_score(user_id, c_id) for c_id in candidate_ids}
