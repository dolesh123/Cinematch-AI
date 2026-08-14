import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
import mongomock

from database import get_db
from main import app
from security import hash_password

# Setup isolated mongomock test database
mock_client = mongomock.MongoClient()
test_db = mock_client["test_cinematch_isolation"]

def override_get_db():
    yield test_db

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    test_db.movies.delete_many({})
    test_db.users.delete_many({})
    test_db.user_preferences.delete_many({})
    test_db.user_interactions.delete_many({})
    test_db.ratings.delete_many({})
    test_db.watchlists.delete_many({})
    test_db.recommendation_history.delete_many({})

    # Seed 4 distinct test movies
    test_db.movies.insert_many([
        {"id": 101, "title": "Interstellar", "year": 2014, "genres": ["Sci-Fi", "Drama"], "overview": "Space exploration", "rating": 8.7, "director": "Christopher Nolan", "language": "English", "cast_members": ["Matthew McConaughey"], "keywords": ["space"]},
        {"id": 102, "title": "Blade Runner 2049", "year": 2017, "genres": ["Sci-Fi", "Mystery"], "overview": "Cyberpunk future", "rating": 8.0, "director": "Denis Villeneuve", "language": "English", "cast_members": ["Ryan Gosling"], "keywords": ["future"]},
        {"id": 103, "title": "Titanic", "year": 1997, "genres": ["Romance", "Drama"], "overview": "Shipwreck romance", "rating": 7.9, "director": "James Cameron", "language": "English", "cast_members": ["Leonardo DiCaprio"], "keywords": ["shipwreck"]},
        {"id": 104, "title": "The Notebook", "year": 2004, "genres": ["Romance", "Drama"], "overview": "Love story", "rating": 7.8, "director": "Nick Cassavetes", "language": "English", "cast_members": ["Ryan Gosling"], "keywords": ["love"]}
    ])

    # User 1: Sci-Fi
    test_db.users.insert_one({"id": 1, "name": "User A SciFi", "email": "usera@test.com", "password_hash": hash_password("pass123"), "is_admin": False, "created_at": datetime.now(timezone.utc)})
    # User 2: Romance
    test_db.users.insert_one({"id": 2, "name": "User B Romance", "email": "userb@test.com", "password_hash": hash_password("pass123"), "is_admin": False, "created_at": datetime.now(timezone.utc)})

    test_db.user_preferences.insert_many([
        {"user_id": 1, "preferred_genres": ["Sci-Fi"], "preferred_languages": ["English"], "min_rating": 5.0, "max_rating": 10.0, "discovery_slider": 0.4, "preferred_era": [], "favorite_movies": [101, 102], "onboarding_completed": True},
        {"user_id": 2, "preferred_genres": ["Romance"], "preferred_languages": ["English"], "min_rating": 5.0, "max_rating": 10.0, "discovery_slider": 0.5, "preferred_era": [], "favorite_movies": [103, 104], "onboarding_completed": True}
    ])

    test_db.user_interactions.insert_many([
        {"user_id": 1, "movie_id": 101, "interaction_type": "LIKE", "weight": 1.0, "timestamp": datetime.now(timezone.utc)},
        {"user_id": 2, "movie_id": 103, "interaction_type": "LIKE", "weight": 1.0, "timestamp": datetime.now(timezone.utc)}
    ])


def test_unauthenticated_request_fails():
    res = client.get("/api/recommendations")
    assert res.status_code == 401


def test_multi_user_recommendation_isolation():
    # 1. Login User A
    res_a = client.post("/api/auth/login", json={"email": "usera@test.com", "password": "pass123"})
    assert res_a.status_code == 200
    token_a = res_a.json()["access_token"]

    # 2. Login User B
    res_b = client.post("/api/auth/login", json={"email": "userb@test.com", "password": "pass123"})
    assert res_b.status_code == 200
    token_b = res_b.json()["access_token"]

    # 3. Get User A recommendations
    recs_a_res = client.get("/api/recommendations", headers={"Authorization": f"Bearer {token_a}"})
    assert recs_a_res.status_code == 200
    recs_a = recs_a_res.json()
    recs_a_titles = [m["title"] for m in recs_a]

    # 4. Get User B recommendations
    recs_b_res = client.get("/api/recommendations", headers={"Authorization": f"Bearer {token_b}"})
    assert recs_b_res.status_code == 200
    recs_b = recs_b_res.json()
    recs_b_titles = [m["title"] for m in recs_b]

    # VERIFY USER ISOLATION: User A top recommendations are Sci-Fi, User B top recommendations are Romance
    assert recs_a_titles[0] in ["Interstellar", "Blade Runner 2049"]
    assert recs_b_titles[0] in ["Titanic", "The Notebook"]
    assert recs_a_titles != recs_b_titles, "CRITICAL FAIL: User A and User B received identical recommendation lists!"


def test_user_a_preference_update_does_not_mutate_user_b():
    res_a = client.post("/api/auth/login", json={"email": "usera@test.com", "password": "pass123"})
    token_a = res_a.json()["access_token"]
    res_b = client.post("/api/auth/login", json={"email": "userb@test.com", "password": "pass123"})
    token_b = res_b.json()["access_token"]

    # Record User B initial top recommendation
    res_b_before = client.get("/api/recommendations", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b_before.status_code == 200
    b_before = res_b_before.json()

    # User A updates preferences
    res_a_update = client.put("/api/preferences", json={
        "preferred_genres": ["Romance"],
        "preferred_languages": ["English"],
        "min_rating": 5.0,
        "max_rating": 10.0,
        "discovery_slider": 0.5,
        "onboarding_completed": True
    }, headers={"Authorization": f"Bearer {token_a}"})
    assert res_a_update.status_code == 200

    # Verify User B recommendations remain unchanged
    res_b_after = client.get("/api/recommendations", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b_after.status_code == 200
    b_after = res_b_after.json()

    assert [m["id"] for m in b_before] == [m["id"] for m in b_after], "CRITICAL FAIL: Updating User A mutated User B!"
