import json
import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from models import Movie, UserPreference, UserInteraction, Rating, User
from ml.content_recommender import ContentBasedRecommender
from ml.collaborative_recommender import CollaborativeRecommender
from ml.llm_recommender import LLMMoodRecommender

class HybridRecommenderEngine:
    def __init__(self, db: Session):
        self.db = db
        self.content_rec = ContentBasedRecommender()
        self.collab_rec = CollaborativeRecommender()
        self.llm_rec = LLMMoodRecommender()
        
        # Ensure models are trained / loaded
        self.content_rec.fit_or_load(db)
        self.collab_rec.fit_or_load(db)

    def generate_recommendations(
        self,
        user: User,
        limit: int = 12,
        mood_query: Optional[str] = None,
        filter_genre: Optional[str] = None,
        filter_language: Optional[str] = None,
        filter_era: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        pref = self.db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
        preferred_genres = json.loads(pref.preferred_genres) if pref and pref.preferred_genres else []
        preferred_languages = json.loads(pref.preferred_languages) if pref and pref.preferred_languages else []
        min_rating = pref.min_rating if pref else 5.0
        discovery_slider = pref.discovery_slider if pref else 0.5
        favorite_movies = json.loads(pref.favorite_movies) if pref and pref.favorite_movies else []

        # Get candidates
        all_movies = self.db.query(Movie).all()
        if not all_movies:
            return []

        # Filter movies already disliked or marked NOT_INTERESTED
        disliked_ids = {
            i.movie_id for i in self.db.query(UserInteraction).filter(
                UserInteraction.user_id == user.id,
                UserInteraction.interaction_type.in_(["DISLIKE", "NOT_INTERESTED"])
            ).all()
        }

        candidates = [m for m in all_movies if m.id not in disliked_ids]

        # Apply category filters if provided
        if filter_genre:
            candidates = [m for m in candidates if filter_genre.lower() in [g.lower() for g in json.loads(m.genres or "[]")]]
        if filter_language:
            candidates = [m for m in candidates if m.language.lower() == filter_language.lower()]
        if filter_era:
            candidates = [m for m in candidates if self._matches_era(m.year, filter_era)]

        candidate_ids = [m.id for m in candidates]
        if not candidate_ids:
            return []

        # 1. Collaborative Scores
        collab_scores = self.collab_rec.get_collaborative_scores(user.id, candidate_ids)

        # 2. Recency Weighting & Content Similarity based on User's Recent Likes
        recent_interactions = (
            self.db.query(UserInteraction)
            .filter(
                UserInteraction.user_id == user.id,
                UserInteraction.interaction_type.in_(["LIKE", "RATING", "WATCHLIST"])
            )
            .order_by(UserInteraction.timestamp.desc())
            .limit(10)
            .all()
        )

        recent_movie_weights = {}
        now = datetime.utcnow()
        for inter in recent_interactions:
            days_diff = (now - inter.timestamp).total_seconds() / 86400.0
            recency_decay = math.exp(-0.05 * days_diff)  # Exponential recency decay e^(-lambda * dt)
            base_w = 1.0 if inter.interaction_type == "LIKE" else 0.7
            recent_movie_weights[inter.movie_id] = base_w * recency_decay

        # Include onboarding favorite movies if no recent interactions exist
        if not recent_movie_weights and favorite_movies:
            for f_id in favorite_movies:
                recent_movie_weights[f_id] = 1.0

        # Compute combined content similarity against user's liked seed movies
        content_sims = {c_id: 0.0 for c_id in candidate_ids}
        if recent_movie_weights:
            total_weight = sum(recent_movie_weights.values())
            for seed_id, seed_w in recent_movie_weights.items():
                sim_map = self.content_rec.get_content_similarity(seed_id, candidate_ids)
                for c_id, sim_val in sim_map.items():
                    content_sims[c_id] += sim_val * (seed_w / total_weight)
        else:
            # Fallback for fresh cold-start users
            for c_id in candidate_ids:
                content_sims[c_id] = 0.5

        # 3. LLM Mood Parsing (if prompt provided)
        llm_data = None
        mood_query_sims = {}
        if mood_query:
            llm_data = self.llm_rec.parse_mood_and_intent(mood_query)
            mood_query_sims = self.content_rec.get_query_text_similarity(llm_data.get("query_text", mood_query), candidate_ids)

        # 4. Multi-Factor Hybrid Ranking Formula
        scored_results = []
        
        # Configurable weights (adjusted by discovery slider)
        # Higher discovery = higher collaborative & lower genre lock
        w_content = 0.35 * (1.0 - 0.2 * discovery_slider)
        w_collab = 0.30 * (1.0 + 0.3 * discovery_slider)
        w_genre = 0.15
        w_lang = 0.10
        w_rating = 0.10

        for movie in candidates:
            m_id = movie.id
            movie_genres = json.loads(movie.genres or "[]")
            movie_vibes = json.loads(movie.emotional_vibes or "[]")

            # Genre Match (0.0 to 1.0)
            genre_overlap = set(g.lower() for g in movie_genres).intersection(set(g.lower() for g in preferred_genres))
            genre_score = len(genre_overlap) / max(1, len(preferred_genres)) if preferred_genres else 0.5

            # Language Match (0.0 to 1.0)
            lang_score = 1.0 if not preferred_languages or movie.language in preferred_languages else 0.4

            # Rating Compatibility
            rating_score = max(0.0, min(1.0, (movie.rating - 5.0) / 5.0))

            # Content Similarity Score
            c_score = content_sims.get(m_id, 0.5)

            # Collaborative Score
            col_score = collab_scores.get(m_id, 0.5)

            # Mood Query Boost (if active)
            mood_boost = 0.0
            if llm_data:
                target_genres = llm_data.get("target_genres", [])
                target_vibes = llm_data.get("target_vibes", [])
                
                # Check genre match against mood
                m_g_match = len(set(g.lower() for g in movie_genres).intersection(set(g.lower() for g in target_genres)))
                # Check vibe match
                m_v_match = len(set(v.lower() for v in movie_vibes).intersection(set(v.lower() for v in target_vibes)))
                
                text_sim = mood_query_sims.get(m_id, 0.0)
                mood_boost = (0.4 * m_g_match + 0.4 * m_v_match + 0.2 * text_sim)

            # Final Score Calculation
            final_raw = (
                w_content * c_score +
                w_collab * col_score +
                w_genre * genre_score +
                w_lang * lang_score +
                w_rating * rating_score +
                (0.25 * mood_boost if llm_data else 0.0)
            )

            # Convert to match percentage (scale to 65% - 99% range for clean UI UX)
            match_percentage = min(99.0, max(65.0, round(final_raw * 100.0, 1)))

            # Formulate Algorithmic Explanation Rationale
            explanation = self._build_explanation(
                movie=movie,
                user=user,
                c_score=c_score,
                col_score=col_score,
                genre_overlap=genre_overlap,
                llm_data=llm_data,
                seed_movies=list(recent_movie_weights.keys())
            )

            explanation_details = {
                "Genre Match": round(genre_score * 100, 1),
                "Content Similarity": round(c_score * 100, 1),
                "Collaborative Signal": round(col_score * 100, 1),
                "Rating Compatibility": round(rating_score * 100, 1)
            }

            scored_results.append({
                "movie": movie,
                "match_score": match_percentage,
                "content_score": round(c_score, 3),
                "collaborative_score": round(col_score, 3),
                "genre_score": round(genre_score, 3),
                "language_score": round(lang_score, 3),
                "explanation": explanation,
                "explanation_details": explanation_details,
                "final_raw": final_raw
            })

        # Sort by final score descending
        scored_results.sort(key=lambda x: x["final_raw"], reverse=True)
        return scored_results[:limit]

    def _build_explanation(
        self,
        movie: Movie,
        user: User,
        c_score: float,
        col_score: float,
        genre_overlap: set,
        llm_data: Optional[dict],
        seed_movies: list
    ) -> str:
        if llm_data:
            return f"🎯 Matches your mood request '{llm_data.get('query_text')}': {llm_data.get('rationale')}"

        if seed_movies:
            # Find closest seed movie
            seed_movie_obj = self.db.query(Movie).filter(Movie.id == seed_movies[0]).first()
            if seed_movie_obj and c_score > 0.6:
                return f"Recommended because you liked '{seed_movie_obj.title}' and enjoy {', '.join([g.title() for g in genre_overlap]) or 'similar'} stories."

        if col_score > 0.7:
            return "Viewers with movie preferences similar to yours highly enjoyed this title."

        if genre_overlap:
            return f"Picked based on your strong preference for {', '.join([g.title() for g in list(genre_overlap)[:2]])}."

        return f"High quality match ({movie.rating}/10) tailored to your personalized user profile."

    def _matches_era(self, year: int, era: str) -> bool:
        if era == "Classic": return year < 1980
        if era == "1980-2000": return 1980 <= year < 2000
        if era == "2000-2010": return 2000 <= year < 2010
        if era == "2010-2020": return 2010 <= year < 2020
        if era == "2020+": return year >= 2020
        return True
