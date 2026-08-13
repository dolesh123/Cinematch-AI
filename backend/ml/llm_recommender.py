import os
import json
import re
from typing import Dict, List, Any

# Keyword & Mood Mapping Dictionary for Fallback NLP Parser
MOOD_GENRE_MAP = {
    "sad": {
        "target_genres": ["Comedy", "Animation", "Drama", "Romance"],
        "target_vibes": ["feel-good", "uplifting", "heartwarming", "wholesome"],
        "sentiment": "seeking_comfort",
        "rationale_template": "Picked to lift your spirits and bring comfort."
    },
    "happy": {
        "target_genres": ["Adventure", "Comedy", "Action", "Music"],
        "target_vibes": ["high-energy", "fun", "vibrant", "hilarious"],
        "sentiment": "joyful",
        "rationale_template": "Matches your positive and high-energy mood!"
    },
    "romcom": {
        "target_genres": ["Romance", "Comedy"],
        "target_vibes": ["romantic", "witty", "charming", "heartwarming"],
        "sentiment": "romantic_comedy",
        "rationale_template": "Selected for the ultimate feel-good romantic comedy experience."
    },
    "romance": {
        "target_genres": ["Romance", "Drama"],
        "target_vibes": ["romantic", "passionate", "heartfelt"],
        "sentiment": "romantic",
        "rationale_template": "Chosen because you're looking for romantic stories."
    },
    "thriller": {
        "target_genres": ["Thriller", "Mystery", "Sci-Fi"],
        "target_vibes": ["suspenseful", "intense", "mind-bending"],
        "sentiment": "suspenseful",
        "rationale_template": "Ranked to deliver heart-pounding suspense and thrill."
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
        "rationale_template": "Recommended to help you unwind and relax."
    },
    "bored": {
        "target_genres": ["Action", "Sci-Fi", "Adventure"],
        "target_vibes": ["fast-paced", "intense", "high-energy"],
        "sentiment": "seeking_excitement",
        "rationale_template": "Handpicked for non-stop action and excitement!"
    }
}

class LLMMoodRecommender:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")

    def parse_mood_and_intent(self, prompt: str) -> Dict[str, Any]:
        """
        Parses user prompt using Gemini API if available, or fallback NLP rules.
        Returns target_genres, target_vibes, query_text, sentiment, and rationale.
        """
        if self.api_key:
            try:
                from google import genai
                client = genai.Client(api_key=self.api_key)
                
                system_instruction = (
                    "You are an AI movie recommendation assistant. Extract movie preferences from the user's natural language input. "
                    "Return ONLY a valid JSON object with keys: target_genres (list of strings e.g. ['Sci-Fi', 'Romance']), "
                    "target_vibes (list of strings e.g. ['mind-bending', 'uplifting']), sentiment (string), "
                    "query_text (string summarizing core request), rationale (short string explaining why candidates match)."
                )
                
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=f"{system_instruction}\n\nUser Input: '{prompt}'"
                )
                
                json_match = re.search(r"\{.*\}", response.text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(0))
            except Exception as e:
                print(f"Gemini API call failed or unavailable ({e}). Falling back to heuristic NLP parser...")

        # Fallback Heuristic NLP Parser
        return self._heuristic_nlp_parse(prompt)

    def _heuristic_nlp_parse(self, prompt: str) -> Dict[str, Any]:
        prompt_lower = prompt.lower()
        matched_genres = set()
        matched_vibes = set()
        sentiments = []
        rationales = []

        # Check explicit keywords
        for key, data in MOOD_GENRE_MAP.items():
            if key in prompt_lower:
                matched_genres.update(data["target_genres"])
                matched_vibes.update(data["target_vibes"])
                sentiments.append(data["sentiment"])
                rationales.append(data["rationale_template"])

        # Explicit genre checks
        all_genres = ["sci-fi", "action", "romance", "comedy", "animation", "drama", "thriller", "mystery", "adventure", "crime", "family"]
        for g in all_genres:
            if g in prompt_lower:
                matched_genres.add(g.title() if g != "sci-fi" else "Sci-Fi")

        if not matched_genres:
            matched_genres = ["Comedy", "Drama", "Sci-Fi"]  # Broad defaults

        rationale_str = " ".join(rationales) if rationales else f"Specially tailored for your query: '{prompt}'."

        return {
            "target_genres": list(matched_genres),
            "target_vibes": list(matched_vibes),
            "sentiment": sentiments[0] if sentiments else "custom_search",
            "query_text": prompt,
            "rationale": rationale_str
        }
