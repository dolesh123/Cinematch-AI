import re
import difflib
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from models import Movie, UserPreference, UserInteraction, Rating, User
from ml.unified_recommender import UnifiedRecommender
from ml.nlp_recommender import NLPQueryRecommender

class HybridRecommenderEngine:
    def __init__(self, db):
        self.db = db
        self.unified_rec = UnifiedRecommender()
        self.nlp_rec = NLPQueryRecommender()
        
        # Ensure single combined dataset model is trained / loaded
        self.unified_rec.fit_or_load(db)

    def generate_recommendations(
        self,
        user: User,
        limit: int = 12,
        mood_query: Optional[str] = None,
        filter_genre: Optional[str] = None,
        filter_language: Optional[str] = None,
        filter_era: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        pref = self.db.user_preferences.find_one({"user_id": user.id})
        preferred_genres = pref.get("preferred_genres", []) if pref else []
        preferred_languages = pref.get("preferred_languages", []) if pref else []
        min_rating = float(pref.get("min_rating", 5.0)) if pref else 5.0
        discovery_slider = float(pref.get("discovery_slider", 0.5)) if pref else 0.5
        favorite_movies = pref.get("favorite_movies", []) if pref else []

        movie_docs = list(self.db.movies.find({}))
        if not movie_docs:
            return []

        all_movies = [Movie.from_doc(m) for m in movie_docs]

        disliked_ids = {
            int(i.get("movie_id", 0)) for i in self.db.user_interactions.find({
                "user_id": user.id,
                "interaction_type": {"$in": ["DISLIKE", "NOT_INTERESTED"]}
            })
        }

        candidates = [m for m in all_movies if m.id not in disliked_ids]

        if filter_genre:
            candidates = [m for m in candidates if filter_genre.lower() in [g.lower() for g in m.genres]]
        if filter_language:
            candidates = [m for m in candidates if m.language.lower() == filter_language.lower()]
        if filter_era:
            candidates = [m for m in candidates if self._matches_era(m.year, filter_era)]

        candidate_ids = [m.id for m in candidates]
        if not candidate_ids:
            return []

        # 1. Collaborative Scores extracted from single combined dataset
        collab_scores = self.unified_rec.get_collaborative_scores(user.id, candidate_ids)

        # 2. Recency Weighting & Content Similarity based on User's Recent Likes
        recent_interactions = list(
            self.db.user_interactions.find({
                "user_id": user.id,
                "interaction_type": {"$in": ["LIKE", "RATING", "WATCHLIST"]}
            }).sort("timestamp", -1).limit(10)
        )

        recent_movie_weights = {}
        now = datetime.now(timezone.utc)
        for inter in recent_interactions:
            inter_ts = inter.get("timestamp") or now
            if inter_ts.tzinfo is None:
                inter_ts = inter_ts.replace(tzinfo=timezone.utc)
            days_diff = (now - inter_ts).total_seconds() / 86400.0
            recency_decay = math.exp(-0.05 * max(0.0, days_diff))
            base_w = 1.0 if inter.get("interaction_type") == "LIKE" else 0.7
            recent_movie_weights[int(inter.get("movie_id", 0))] = base_w * recency_decay

        if not recent_movie_weights and favorite_movies:
            for f_id in favorite_movies:
                recent_movie_weights[int(f_id)] = 1.0

        content_sims = {c_id: 0.0 for c_id in candidate_ids}
        if recent_movie_weights:
            total_weight = sum(recent_movie_weights.values())
            for seed_id, seed_w in recent_movie_weights.items():
                sim_map = self.unified_rec.get_content_similarity(seed_id, candidate_ids)
                for c_id, sim_val in sim_map.items():
                    content_sims[c_id] += sim_val * (seed_w / total_weight)
        else:
            for c_id in candidate_ids:
                content_sims[c_id] = 0.5

        # Extract user favorite directors & cast from recent likes / favorite movies
        user_fav_directors = set()
        user_fav_cast = set()
        if recent_movie_weights:
            for s_id in recent_movie_weights.keys():
                s_movie = next((m for m in all_movies if m.id == s_id), None)
                if s_movie:
                    if s_movie.director and s_movie.director != "Unknown":
                        user_fav_directors.add(s_movie.director.lower().strip())
                    for c_name in s_movie.cast_members[:4]:
                        user_fav_cast.add(c_name.lower().strip())

        # 3. Pure NLP Search Feature Extraction
        nlp_data = None
        mood_query_sims = {}
        if mood_query:
            nlp_data = self.nlp_rec.extract_search_features(mood_query)
            mood_query_sims = self.unified_rec.get_query_text_similarity(nlp_data.get("query_text", mood_query), candidate_ids)

        # 4. Multi-Factor Hybrid Ranking Formula (Content, Collaborative, Genres, Title, Director, Cast)
        scored_results = []
        
        w_content = 0.30 * (1.0 - 0.2 * discovery_slider)
        w_collab = 0.25 * (1.0 + 0.3 * discovery_slider)
        w_genre = 0.15
        w_lang = 0.10
        w_rating = 0.10
        w_director_aff = 0.15
        w_cast_aff = 0.10
        w_title = 0.40

        # Extract excluded genres / vibes from NLP negation detection
        excluded_genres = set(g.lower() for g in (nlp_data.get("excluded_genres") or [])) if nlp_data else set()
        excluded_vibes = set(v.lower() for v in (nlp_data.get("excluded_vibes") or [])) if nlp_data else set()

        for movie in candidates:
            m_id = movie.id
            movie_genres = movie.genres
            movie_vibes = movie.emotional_vibes
            movie_cast = movie.cast_members
            movie_director = str(movie.director or "")

            # Strict Negation Filtering: Exclude any movie containing negated genres or vibes
            if excluded_genres and any(g.lower() in excluded_genres for g in movie_genres):
                continue
            if excluded_vibes and any(v.lower() in excluded_vibes for v in movie_vibes):
                continue

            genre_overlap = set(g.lower() for g in movie_genres).intersection(set(g.lower() for g in preferred_genres))
            genre_score = len(genre_overlap) / max(1, len(preferred_genres)) if preferred_genres else 0.5

            lang_score = 1.0 if not preferred_languages or movie.language in preferred_languages else 0.4
            rating_score = max(0.0, min(1.0, (movie.rating - 5.0) / 5.0))

            c_score = content_sims.get(m_id, 0.5)
            col_score = collab_scores.get(m_id, 0.5)

            # Director and Cast affinity from user history
            dir_affinity = 1.0 if movie_director.lower().strip() in user_fav_directors else 0.0
            matched_fav_cast = set(c.lower().strip() for c in movie_cast[:5]).intersection(user_fav_cast)
            cast_affinity = len(matched_fav_cast) / max(1, min(3, len(user_fav_cast))) if user_fav_cast else 0.0

            # Director, Cast, and Title matches to search query
            is_neg = bool(excluded_genres or excluded_vibes)
            title_sim = self._compute_title_similarity(mood_query, movie.title, is_negation=is_neg) if mood_query else 0.0
            dir_sim, cast_sim, matched_dir_name, matched_cast_name = self._compute_person_match(
                mood_query, movie_director, movie_cast
            ) if mood_query and not is_neg else (0.0, 0.0, None, None)

            mood_boost = 0.0
            if nlp_data:
                target_genres = nlp_data.get("target_genres", [])
                target_vibes = nlp_data.get("target_vibes", [])
                
                m_g_match = len(set(g.lower() for g in movie_genres).intersection(set(g.lower() for g in target_genres))) if target_genres else 0
                m_v_match = len(set(v.lower() for v in movie_vibes).intersection(set(v.lower() for v in target_vibes))) if target_vibes else 0
                
                text_sim = mood_query_sims.get(m_id, 0.0)
                mood_boost = (0.35 * m_g_match + 0.35 * m_v_match + 0.3 * text_sim)

            # Base ranking score
            final_raw = (
                w_content * c_score +
                w_collab * col_score +
                w_genre * genre_score +
                w_lang * lang_score +
                w_rating * rating_score +
                w_director_aff * dir_affinity +
                w_cast_aff * cast_affinity +
                (0.25 * mood_boost if nlp_data else 0.0) +
                (w_title * title_sim if mood_query else 0.0)
            )

            # High priority boosts for specific query intentions
            if title_sim >= 0.70:
                final_raw += 2.5 + title_sim * 2.0
                match_percentage = min(99.0, max(95.0, round((0.95 + 0.04 * title_sim) * 100.0, 1)))
            elif dir_sim >= 0.70:
                final_raw += 2.2 + dir_sim * 2.0
                match_percentage = min(99.0, max(95.0, round((0.95 + 0.04 * dir_sim) * 100.0, 1)))
            elif cast_sim >= 0.70:
                final_raw += 2.0 + cast_sim * 2.0
                match_percentage = min(99.0, max(94.0, round((0.94 + 0.05 * cast_sim) * 100.0, 1)))
            elif title_sim >= 0.40 or dir_sim >= 0.40 or cast_sim >= 0.40:
                final_raw += 0.8 + max(title_sim, dir_sim, cast_sim)
                match_percentage = min(98.0, max(85.0, round(final_raw * 100.0, 1)))
            else:
                match_percentage = min(99.0, max(65.0, round(final_raw * 100.0, 1)))

            explanation = self._build_explanation(
                movie=movie,
                user=user,
                c_score=c_score,
                col_score=col_score,
                genre_overlap=genre_overlap,
                nlp_data=nlp_data,
                seed_movies=list(recent_movie_weights.keys()),
                title_sim=title_sim,
                dir_sim=dir_sim,
                cast_sim=cast_sim,
                matched_dir_name=matched_dir_name,
                matched_cast_name=matched_cast_name,
                dir_affinity=dir_affinity,
                matched_fav_cast=matched_fav_cast,
                query_text=mood_query
            )

            explanation_details = {
                "Genre Match": round(genre_score * 100, 1),
                "Content Similarity": round(c_score * 100, 1),
                "Collaborative Signal": round(col_score * 100, 1),
                "Rating Compatibility": round(rating_score * 100, 1)
            }
            if mood_query:
                if excluded_genres:
                    explanation_details["Excluded Genre Filter"] = ", ".join(g.title() for g in sorted(excluded_genres))
                if title_sim > 0:
                    explanation_details["Title Similarity"] = round(title_sim * 100, 1)
                if dir_sim > 0:
                    explanation_details["Director Match"] = round(dir_sim * 100, 1)
                if cast_sim > 0:
                    explanation_details["Cast Match"] = round(cast_sim * 100, 1)
            else:
                if dir_affinity > 0:
                    explanation_details["Director Affinity"] = 100.0
                if cast_affinity > 0:
                    explanation_details["Cast Affinity"] = round(cast_affinity * 100, 1)

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

        scored_results.sort(key=lambda x: x["final_raw"], reverse=True)
        return scored_results[:limit]

    def _compute_person_match(
        self,
        query: Optional[str],
        director: Optional[str],
        cast: list
    ) -> tuple:
        if not query:
            return 0.0, 0.0, None, None

        def clean(s: str) -> str:
            return re.sub(r'[^a-z0-9 ]', ' ', s.lower()).strip()

        cq = clean(query)
        if not cq or len(cq) < 2:
            return 0.0, 0.0, None, None

        # Check Director
        d_match = 0.0
        d_name_matched = None
        if director and director != "Unknown":
            cd = clean(director)
            if cd == cq:
                d_match = 1.0
                d_name_matched = director
            elif cd in cq:
                d_match = 0.95
                d_name_matched = director
            elif cq in cd:
                d_match = 0.90
                d_name_matched = director
            else:
                d_tokens = cd.split()
                q_tokens = cq.split()
                if any(len(dt) >= 4 and dt in q_tokens for dt in d_tokens):
                    d_match = 0.85
                    d_name_matched = director

        # Check Cast
        c_match = 0.0
        c_name_matched = None
        for actor in (cast or []):
            ca = clean(actor)
            if not ca:
                continue
            if ca == cq:
                c_match = 1.0
                c_name_matched = actor
                break
            elif ca in cq:
                c_match = 0.95
                c_name_matched = actor
                break
            elif cq in ca:
                c_match = 0.90
                c_name_matched = actor
                break
            else:
                a_tokens = ca.split()
                q_tokens = cq.split()
                if any(len(at) >= 4 and at in q_tokens for at in a_tokens):
                    c_match = 0.85
                    c_name_matched = actor
                    break

        return d_match, c_match, d_name_matched, c_name_matched

    STOPWORDS = {
        "movie", "movies", "film", "films", "watch", "see", "want", "dont",
        "do", "not", "no", "with", "without", "give", "me", "a", "an", "the",
        "to", "i", "like", "recommend", "show", "please", "something", "anything",
        "about", "for", "in", "of", "and", "or", "but", "good", "best", "some"
    }

    def _compute_title_similarity(self, query: Optional[str], title: Optional[str], is_negation: bool = False) -> float:
        if not query or not title or is_negation:
            return 0.0

        def clean_text(s: str) -> str:
            return re.sub(r'[^a-z0-9 ]', ' ', s.lower()).strip()

        cq = clean_text(query)
        ct = clean_text(title)
        if not cq or not ct:
            return 0.0

        # Exact match
        if cq == ct:
            return 1.0

        # Filter out common conversational stopwords
        q_sig = [w for w in cq.split() if w not in self.STOPWORDS]
        t_sig = [w for w in ct.split() if w not in self.STOPWORDS]
        if not q_sig or not t_sig:
            return 0.0

        cq_phrase = " ".join(q_sig)
        ct_phrase = " ".join(t_sig)

        # Exact match on significant words (e.g. "The Dark Knight" vs "dark knight")
        if cq_phrase == ct_phrase:
            return 0.98

        # Exact whole-phrase containment for distinct title searches
        if len(cq_phrase) >= 4:
            if f" {cq_phrase} " in f" {ct_phrase} ":
                return 0.92 + 0.08 * (len(cq_phrase) / max(len(ct_phrase), 1))
            if f" {ct_phrase} " in f" {cq_phrase} " and len(ct_phrase) >= 4:
                return 0.88 + 0.10 * (len(ct_phrase) / max(len(cq_phrase), 1))

        # Jaccard overlap on significant words
        q_set = set(q_sig)
        t_set = set(t_sig)
        if q_set and t_set:
            overlap = len(q_set & t_set)
            jaccard = overlap / len(q_set | t_set)
            q_containment = overlap / len(q_set)
        else:
            jaccard = 0.0
            q_containment = 0.0

        # Fuzzy edit distance
        ratio = difflib.SequenceMatcher(None, cq_phrase, ct_phrase).ratio()

        if q_containment >= 1.0 and len(q_sig) >= 2:
            return float(max(ratio, 0.90))

        if ratio >= 0.75 or jaccard >= 0.6:
            return float(max(ratio, jaccard))

        return 0.0

    def _build_explanation(
        self,
        movie: Movie,
        user: User,
        c_score: float,
        col_score: float,
        genre_overlap: set,
        nlp_data: Optional[dict],
        seed_movies: list,
        title_sim: float = 0.0,
        dir_sim: float = 0.0,
        cast_sim: float = 0.0,
        matched_dir_name: Optional[str] = None,
        matched_cast_name: Optional[str] = None,
        dir_affinity: float = 0.0,
        matched_fav_cast: Optional[set] = None,
        query_text: Optional[str] = None
    ) -> str:
        # Search query explanations
        if dir_sim >= 0.70 and matched_dir_name:
            return f"🎬 Directed by {matched_dir_name} matching your search for '{query_text}'."
        elif cast_sim >= 0.70 and matched_cast_name:
            return f"🌟 Starring {matched_cast_name} matching your search for '{query_text}'."
        elif title_sim >= 0.85:
            return f"🎬 Direct Title Match: '{movie.title}' matches your search for '{query_text}'."
        elif title_sim >= 0.50:
            return f"🍿 High Title & Franchise Similarity to your search '{query_text}'."

        if nlp_data:
            return f"🎯 NLP Feature Match for '{nlp_data.get('query_text')}': {nlp_data.get('rationale')}"

        # Profile-based director / cast affinity explanations
        if dir_affinity > 0 and movie.director and movie.director != "Unknown":
            return f"🎬 Recommended because you enjoy films directed by {movie.director}."

        if matched_fav_cast:
            actors_str = ", ".join(c.title() for c in list(matched_fav_cast)[:2])
            return f"🌟 Features {actors_str}, starring in your favorite movies."

        if seed_movies:
            seed_movie_doc = self.db.movies.find_one({"id": seed_movies[0]})
            if seed_movie_doc and c_score > 0.6:
                seed_title = seed_movie_doc.get("title", "")
                return f"Recommended because you liked '{seed_title}' and enjoy {', '.join([g.title() for g in genre_overlap]) or 'similar'} stories."

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
