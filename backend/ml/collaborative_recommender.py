import os
import joblib
import pandas as pd
import numpy as np
from sklearn.decomposition import TruncatedSVD
from sqlalchemy.orm import Session
from models import Rating, UserInteraction

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models")

class CollaborativeRecommender:
    def __init__(self, n_components: int = 10):
        self.n_components = n_components
        self.svd = TruncatedSVD(n_components=n_components, random_state=42)
        self.user_item_matrix = None
        self.user_map = {}  # user_id -> matrix row index
        self.movie_map = {}  # movie_id -> matrix col index
        self.inv_user_map = {}
        self.inv_movie_map = {}
        self.user_factors = None
        self.item_factors = None

    def fit_or_load(self, db: Session, force_retrain: bool = False):
        os.makedirs(MODEL_DIR, exist_ok=True)
        collab_path = os.path.join(MODEL_DIR, "collaborative_model.pkl")

        if not force_retrain and os.path.exists(collab_path):
            try:
                data = joblib.load(collab_path)
                self.svd = data["svd"]
                self.user_map = data["user_map"]
                self.movie_map = data["movie_map"]
                self.user_factors = data["user_factors"]
                self.item_factors = data["item_factors"]
                self.inv_user_map = {v: k for k, v in self.user_map.items()}
                self.inv_movie_map = {v: k for k, v in self.movie_map.items()}
                return
            except Exception as e:
                print(f"Error loading collaborative model: {e}. Retraining...")

        self.retrain(db)

    def retrain(self, db: Session):
        ratings = db.query(Rating).all()
        interactions = db.query(UserInteraction).all()

        records = []
        for r in ratings:
            records.append({
                "user_id": r.user_id,
                "movie_id": r.movie_id,
                "weight": r.rating  # 1-10
            })

        for i in interactions:
            w_map = {
                "LIKE": 8.0,
                "DISLIKE": 2.0,
                "RATING": 8.0,
                "WATCHLIST": 7.0,
                "VIEW_DETAILS": 6.0,
                "NOT_INTERESTED": 1.0
            }
            records.append({
                "user_id": i.user_id,
                "movie_id": i.movie_id,
                "weight": w_map.get(i.interaction_type, 5.0)
            })

        if not records:
            return

        df = pd.DataFrame(records)
        pivot = df.pivot_table(index="user_id", columns="movie_id", values="weight", aggfunc="mean").fillna(5.0)

        self.user_map = {uid: idx for idx, uid in enumerate(pivot.index)}
        self.movie_map = {mid: idx for idx, mid in enumerate(pivot.columns)}
        self.inv_user_map = {v: k for k, v in self.user_map.items()}
        self.inv_movie_map = {v: k for k, v in self.movie_map.items()}

        matrix = pivot.values
        n_comp = min(self.n_components, matrix.shape[0] - 1, matrix.shape[1] - 1)
        n_comp = max(1, n_comp)

        self.svd = TruncatedSVD(n_components=n_comp, random_state=42)
        self.user_factors = self.svd.fit_transform(matrix)
        self.item_factors = self.svd.components_.T

        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump({
            "svd": self.svd,
            "user_map": self.user_map,
            "movie_map": self.movie_map,
            "user_factors": self.user_factors,
            "item_factors": self.item_factors
        }, os.path.join(MODEL_DIR, "collaborative_model.pkl"))

        print("Collaborative SVD recommender retrained successfully!")

    def predict_score(self, user_id: int, movie_id: int) -> float:
        if self.user_factors is None or user_id not in self.user_map or movie_id not in self.movie_map:
            return 0.5  # Neutral fallback for cold start

        u_idx = self.user_map[user_id]
        m_idx = self.movie_map[movie_id]

        u_vec = self.user_factors[u_idx]
        m_vec = self.item_factors[m_idx]

        score = float(np.dot(u_vec, m_vec))
        # Scale score to 0.0 - 1.0 range
        norm_score = 1.0 / (1.0 + np.exp(-(score - 5.0) / 2.0))
        return norm_score

    def get_collaborative_scores(self, user_id: int, candidate_ids: list) -> dict:
        result = {}
        for c_id in candidate_ids:
            result[c_id] = self.predict_score(user_id, c_id)
        return result
