import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from models import User, UserPreference, Movie, Rating, UserInteraction
from security import hash_password

# Setup isolated test database engine
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_isolation.db"
test_engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    db = TestingSessionLocal()
    # Seed 4 distinct movies
    m1 = Movie(id=101, title="Interstellar", year=2014, genres='["Sci-Fi", "Drama"]', overview="Space exploration", rating=8.7, director="Nolan")
    m2 = Movie(id=102, title="Blade Runner 2049", year=2017, genres='["Sci-Fi", "Mystery"]', overview="Cyberpunk future", rating=8.0, director="Villeneuve")
    m3 = Movie(id=103, title="Titanic", year=1997, genres='["Romance", "Drama"]', overview="Shipwreck romance", rating=7.9, director="Cameron")
    m4 = Movie(id=104, title="The Notebook", year=2004, genres='["Romance", "Drama"]', overview="Love story", rating=7.8, director="Cassavetes")
    db.add_all([m1, m2, m3, m4])
    db.commit()

    # User A: Sci-Fi
    user_a = User(id=1, name="User A SciFi", email="usera@test.com", password_hash=hash_password("pass123"))
    # User B: Romance
    user_b = User(id=2, name="User B Romance", email="userb@test.com", password_hash=hash_password("pass123"))
    db.add_all([user_a, user_b])
    db.commit()

    pref_a = UserPreference(user_id=1, preferred_genres='["Sci-Fi"]', preferred_languages='["English"]', onboarding_completed=True, favorite_movies='[101, 102]')
    pref_b = UserPreference(user_id=2, preferred_genres='["Romance"]', preferred_languages='["English"]', onboarding_completed=True, favorite_movies='[103, 104]')
    db.add_all([pref_a, pref_b])

    db.add(UserInteraction(user_id=1, movie_id=101, interaction_type="LIKE", weight=1.0))
    db.add(UserInteraction(user_id=2, movie_id=103, interaction_type="LIKE", weight=1.0))
    db.commit()
    db.close()


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
