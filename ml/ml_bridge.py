import sys
import os
import json
import argparse

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_database
from models import User
from ml.hybrid_engine import HybridRecommenderEngine
from ml.evaluation import ModelEvaluator

def main():
    parser = argparse.ArgumentParser(description="CineMatch AI ML Bridge")
    parser.add_argument("--task", type=str, default="recommend", choices=["recommend", "evaluate", "retrain"])
    parser.add_argument("--user_id", type=int, default=1)
    parser.add_argument("--limit", type=int, default=12)
    parser.add_argument("--mood_query", type=str, default=None)
    parser.add_argument("--genre", type=str, default=None)
    parser.add_argument("--language", type=str, default=None)
    parser.add_argument("--era", type=str, default=None)
    parser.add_argument("--input_json", type=str, default=None)

    args = parser.parse_args()

    db = get_database()
    if db.movies.count_documents({}) == 0:
        from seed_data import seed_database
        seed_database()

    if args.input_json:
        try:
            params = json.loads(args.input_json)
            args.task = params.get("task", args.task)
            args.user_id = params.get("user_id", args.user_id)
            args.limit = params.get("limit", args.limit)
            args.mood_query = params.get("mood_query", args.mood_query)
            args.genre = params.get("genre", args.genre)
            args.language = params.get("language", args.language)
            args.era = params.get("era", args.era)
        except Exception:
            pass

    if args.task == "evaluate":
        evaluator = ModelEvaluator(db)
        metrics = evaluator.evaluate(k=5)
        print(json.dumps(metrics))
        return

    if args.task == "recommend":
        user_doc = db.users.find_one({"id": args.user_id})
        if not user_doc:
            # Fallback mock user if not registered yet
            user = User(id=args.user_id, name="User", email="user@cinematch.ai", password_hash="")
        else:
            user = User.from_doc(user_doc)

        engine = HybridRecommenderEngine(db)
        recs = engine.generate_recommendations(
            user=user,
            limit=args.limit,
            mood_query=args.mood_query,
            filter_genre=args.genre,
            filter_language=args.language,
            filter_era=args.era
        )

        output = []
        for item in recs:
            m = item["movie"]
            output.append({
                "id": m.id,
                "title": m.title,
                "year": m.year,
                "genres": m.genres,
                "language": m.language,
                "rating": m.rating,
                "vote_count": m.vote_count,
                "overview": m.overview,
                "poster_path": m.poster_path,
                "backdrop_path": m.backdrop_path,
                "director": m.director,
                "cast_members": m.cast_members,
                "keywords": m.keywords,
                "popularity": m.popularity,
                "emotional_vibes": m.emotional_vibes,
                "match_score": item["match_score"],
                "content_score": item["content_score"],
                "collaborative_score": item["collaborative_score"],
                "genre_score": item["genre_score"],
                "language_score": item["language_score"],
                "explanation": item["explanation"],
                "explanation_details": item["explanation_details"]
            })

        print(json.dumps(output))

if __name__ == "__main__":
    main()
