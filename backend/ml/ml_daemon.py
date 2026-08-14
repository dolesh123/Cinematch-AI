import sys
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_database
from models import User
from ml.hybrid_engine import HybridRecommenderEngine
from ml.evaluation import ModelEvaluator
from seed_data import seed_database

print("[ML Daemon] Pre-loading CineMatch ML Recommendation Models into Memory...")
db = get_database()
if db.movies.count_documents({}) == 0:
    seed_database()

engine = HybridRecommenderEngine(db)
evaluator = ModelEvaluator(db)
print("[ML Daemon] All TF-IDF and SVD Models Pre-loaded & Warm! Ready for instant inference.")

class MLRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Quiet logging for ultra-fast performance

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ready"}')
            return

        if parsed.path == "/evaluate":
            metrics = evaluator.evaluate(k=5)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(metrics).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/recommend":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            
            try:
                params = json.loads(body) if body else {}
            except Exception:
                params = {}

            user_id = int(params.get("user_id", 1))
            limit = int(params.get("limit", 12))
            mood_query = params.get("mood_query")
            genre = params.get("genre")
            language = params.get("language")
            era = params.get("era")

            user_doc = db.users.find_one({"id": user_id})
            if not user_doc:
                user = User(id=user_id, name="User", email="user@cinematch.ai", password_hash="")
            else:
                user = User.from_doc(user_doc)

            recs = engine.generate_recommendations(
                user=user,
                limit=limit,
                mood_query=mood_query,
                filter_genre=genre,
                filter_language=language,
                filter_era=era
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

            resp_bytes = json.dumps(output).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
            return

        self.send_response(404)
        self.end_headers()

def run_daemon(port=8001):
    server = HTTPServer(("127.0.0.1", port), MLRequestHandler)
    print(f"[ML Daemon] Running high-speed warm ML daemon on http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    run_daemon()
