import os
import re
import json
from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer

MOOD_GENRE_MAP = {
    "sad": {
        "target_genres": ["Comedy", "Animation", "Drama", "Romance"],
        "target_vibes": ["feel-good", "uplifting", "heartwarming", "wholesome"],
        "sentiment": "seeking_comfort",
        "rationale_template": "Handpicked by NLP model to lift your spirits and bring comfort."
    },
    "happy": {
        "target_genres": ["Adventure", "Comedy", "Action", "Music"],
        "target_vibes": ["high-energy", "fun", "vibrant", "hilarious"],
        "sentiment": "joyful",
        "rationale_template": "Extracted high-energy features matching your positive mood!"
    },
    "romcom": {
        "target_genres": ["Romance", "Comedy"],
        "target_vibes": ["romantic", "witty", "charming", "heartwarming"],
        "sentiment": "romantic_comedy",
        "rationale_template": "NLP feature extraction matched romantic comedy preference terms."
    },
    "romance": {
        "target_genres": ["Romance", "Drama"],
        "target_vibes": ["romantic", "passionate", "heartfelt"],
        "sentiment": "romantic",
        "rationale_template": "Selected based on romantic sentiment analysis from your search query."
    },
    "thriller": {
        "target_genres": ["Thriller", "Mystery", "Sci-Fi"],
        "target_vibes": ["suspenseful", "intense", "mind-bending"],
        "sentiment": "suspenseful",
        "rationale_template": "Ranked to deliver suspenseful and heart-pounding thrill."
    },
    "scifi": {
        "target_genres": ["Sci-Fi", "Adventure", "Mystery"],
        "target_vibes": ["mind-bending", "philosophical", "epic"],
        "sentiment": "curious",
        "rationale_template": "Matches your request for mind-bending sci-fi."
    },
    "stressed": {
        "target_genres": ["Comedy", "Animation", "Family"],
        "target_vibes": ["wholesome", "feel-good", "relaxing", "hilarious"],
        "sentiment": "seeking_relaxation",
        "rationale_template": "Extracted relaxing feature patterns to help you unwind."
    },
    "bored": {
        "target_genres": ["Action", "Sci-Fi", "Adventure"],
        "target_vibes": ["fast-paced", "intense", "high-energy"],
        "sentiment": "seeking_excitement",
        "rationale_template": "Matched for non-stop fast-paced action and excitement."
    },
    "intense": {
        "target_genres": ["Action", "Thriller", "Crime"],
        "target_vibes": ["intense", "suspenseful", "dark"],
        "sentiment": "seeking_intensity",
        "rationale_template": "High intensity query features extracted."
    },
    "mind-bending": {
        "target_genres": ["Sci-Fi", "Mystery", "Thriller"],
        "target_vibes": ["mind-bending", "complex", "philosophical"],
        "sentiment": "curious",
        "rationale_template": "Extracted complex narrative and mind-bending feature tokens."
    }
}

ALL_GENRES = [
    "sci-fi", "action", "romance", "comedy", "animation", 
    "drama", "thriller", "mystery", "adventure", "crime", 
    "family", "fantasy", "music", "history", "war"
]

ALL_VIBES = [
    "mind-bending", "uplifting", "heartwarming", "wholesome",
    "high-energy", "fun", "vibrant", "hilarious", "romantic",
    "witty", "charming", "suspenseful", "intense", "philosophical",
    "epic", "relaxing", "fast-paced", "dark", "chilling", "inspiring"
]

NEGATION_PATTERNS = [
    r"\b(?:don'?t\s+want|do\s+not\s+want|doesn'?t\s+want|dislike|hate|avoid|stop|never|exclude)\b(?:\s+to\s+watch|\s+to\s+see|\s+any|\s+a|\s+an|\s+more|\s+movies?\s+with)?\s+([^,.;]+)",
    r"\b(?:no|not|without|except)\b(?:\s+interested\s+in|\s+any|\s+more|\s+a|\s+an|\s+movies?\s+with)?\s+([^,.;]+)"
]

GENRE_SYNONYM_MAP = {
    "action": "Action",
    "adventure": "Adventure",
    "animation": "Animation",
    "animated": "Animation",
    "anime": "Animation",
    "cartoon": "Animation",
    "comedy": "Comedy",
    "funny": "Comedy",
    "hilarious": "Comedy",
    "crime": "Crime",
    "gangster": "Crime",
    "documentary": "Documentary",
    "docu": "Documentary",
    "drama": "Drama",
    "family": "Family",
    "kids": "Family",
    "children": "Family",
    "fantasy": "Fantasy",
    "history": "History",
    "historical": "History",
    "horror": "Horror",
    "scary": "Horror",
    "spooky": "Horror",
    "music": "Music",
    "musical": "Music",
    "mystery": "Mystery",
    "detective": "Mystery",
    "romance": "Romance",
    "romantic": "Romance",
    "love": "Romance",
    "romcom": "Romance",
    "sci-fi": "Sci-Fi",
    "sci fi": "Sci-Fi",
    "scifi": "Sci-Fi",
    "sci": "Sci-Fi",
    "science fiction": "Sci-Fi",
    "science-fiction": "Sci-Fi",
    "space": "Sci-Fi",
    "alien": "Sci-Fi",
    "thriller": "Thriller",
    "suspense": "Thriller",
    "war": "War",
    "western": "Western"
}

class NLPQueryRecommender:
    """
    Pure local NLP Model for extracting user-specific search features from natural language prompts.
    Includes advanced negation analysis and entity exclusion.
    Zero external LLM or API dependencies.
    """
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))

    def parse_mood_and_intent(self, prompt: str) -> Dict[str, Any]:
        """
        Parses user prompt using pure NLP feature extraction techniques.
        Extracts target_genres, target_vibes, excluded_genres, excluded_vibes, query_text, sentiment, and rationale.
        """
        return self.extract_search_features(prompt)

    def extract_search_features(self, prompt: str) -> Dict[str, Any]:
        prompt_clean = prompt.strip()
        prompt_lower = prompt_clean.lower()
        
        excluded_genres = set()
        excluded_vibes = set()
        matched_genres = set()
        matched_vibes = set()
        sentiments = []
        rationales = []

        # 1. Negation Entity & Constraint Parsing
        for pat in NEGATION_PATTERNS:
            for match in re.finditer(pat, prompt_lower):
                negated_segment = match.group(1)
                for syn, canonical_g in GENRE_SYNONYM_MAP.items():
                    if re.search(r'\b' + re.escape(syn) + r'\b', negated_segment):
                        excluded_genres.add(canonical_g)
                for v in ALL_VIBES:
                    if re.search(r'\b' + re.escape(v) + r'\b', negated_segment):
                        excluded_vibes.add(v)

        # 2. Keyword & Mood/Sentiment Feature Mapping
        for key, data in MOOD_GENRE_MAP.items():
            if key in prompt_lower and not any(key in neg for neg in [m.group(0) for pat in NEGATION_PATTERNS for m in re.finditer(pat, prompt_lower)]):
                for tg in data["target_genres"]:
                    if tg not in excluded_genres:
                        matched_genres.add(tg)
                for tv in data["target_vibes"]:
                    if tv not in excluded_vibes:
                        matched_vibes.add(tv)
                sentiments.append(data["sentiment"])
                rationales.append(data["rationale_template"])

        # 3. Positive Genre Entity Extraction (excluding negated ones)
        for syn, canonical_g in GENRE_SYNONYM_MAP.items():
            if re.search(r'\b' + re.escape(syn) + r'\b', prompt_lower):
                if canonical_g not in excluded_genres:
                    matched_genres.add(canonical_g)

        # 4. Positive Vibe Entity Extraction
        for v in ALL_VIBES:
            if v in prompt_lower and v not in excluded_vibes:
                matched_vibes.add(v)

        # Build detailed human-understandable explanation rationale
        if excluded_genres:
            excl_str = ", ".join(sorted(excluded_genres))
            rationale_str = f"🛡️ Negation Filter: Excluded all {excl_str} movies and ranked top alternative recommendations based on your preferences."
        elif matched_genres or matched_vibes:
            rationale_str = " ".join(rationales) if rationales else f"NLP feature extraction matched your query '{prompt_clean}'."
        else:
            rationale_str = f"NLP & Title similarity analysis matched your search for '{prompt_clean}'."

        return {
            "target_genres": list(matched_genres),
            "target_vibes": list(matched_vibes),
            "excluded_genres": list(excluded_genres),
            "excluded_vibes": list(excluded_vibes),
            "sentiment": sentiments[0] if sentiments else ("nlp_negation_filter" if excluded_genres else "nlp_title_search"),
            "query_text": prompt_clean,
            "rationale": rationale_str
        }
