from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    is_admin: bool
    onboarding_completed: bool

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    onboarding_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Preference Schemas ---
class UserPreferenceUpdate(BaseModel):
    preferred_genres: List[str]
    preferred_languages: List[str]
    min_rating: float = Field(default=5.0, ge=1.0, le=10.0)
    max_rating: float = Field(default=10.0, ge=1.0, le=10.0)
    discovery_slider: float = Field(default=0.5, ge=0.0, le=1.0)
    preferred_era: List[str] = []
    favorite_movies: List[int] = []
    onboarding_completed: bool = True

class UserPreferenceResponse(BaseModel):
    id: int
    user_id: int
    preferred_genres: List[str]
    preferred_languages: List[str]
    min_rating: float
    max_rating: float
    discovery_slider: float
    preferred_era: List[str]
    favorite_movies: List[int]
    onboarding_completed: bool


# --- Movie Schemas ---
class MovieResponse(BaseModel):
    id: int
    title: str
    year: int
    genres: List[str]
    language: str
    rating: float
    vote_count: int
    overview: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    director: str
    cast_members: List[str]
    keywords: List[str]
    popularity: float
    emotional_vibes: List[str] = []

    class Config:
        from_attributes = True


class MovieRecommendation(MovieResponse):
    match_score: float  # Percentage 0-100%
    content_score: float
    collaborative_score: float
    genre_score: float
    language_score: float
    explanation: str
    explanation_details: Dict[str, float]  # breakdown dictionary


# --- Feedback / Interaction Schemas ---
class InteractionCreate(BaseModel):
    movie_id: int
    interaction_type: str  # LIKE, DISLIKE, RATING, WATCHLIST, CLICK, VIEW_DETAILS, NOT_INTERESTED
    rating_value: Optional[float] = None  # Needed if interaction_type is RATING


class WatchlistToggle(BaseModel):
    movie_id: int


class MoodQueryRequest(BaseModel):
    prompt: str = Field(..., min_length=2)


# --- Taste Profile Schemas ---
class GenreAffinity(BaseModel):
    genre: str
    score: float
    percentage: float

class TasteProfileResponse(BaseModel):
    user_name: str
    total_interactions: int
    total_ratings_given: int
    avg_rating_given: float
    top_genres: List[GenreAffinity]
    preferred_languages: List[str]
    recent_activity: List[Dict[str, Any]]
    personalized_insights: List[str]


# --- Admin & Evaluation Schemas ---
class MLMetricsResponse(BaseModel):
    precision_at_k: float
    recall_at_k: float
    f1_at_k: float
    map_at_k: float
    ndcg_at_k: float
    rmse: float
    evaluated_users_count: int
    dataset_movies_count: int
    dataset_ratings_count: int

class AdminAnalyticsResponse(BaseModel):
    total_users: int
    total_movies: int
    total_ratings: int
    total_interactions: int
    active_users_last_24h: int
    recommendation_acceptance_rate: float
    avg_recommendation_latency_ms: float
    ml_metrics: MLMetricsResponse
