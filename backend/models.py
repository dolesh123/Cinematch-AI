from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")
    interactions = relationship("UserInteraction", back_populates="user", cascade="all, delete-orphan")
    watchlist = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("RecommendationHistory", back_populates="user", cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    preferred_genres = Column(Text, default="[]")  # JSON string array
    preferred_languages = Column(Text, default="[]")  # JSON string array
    min_rating = Column(Float, default=6.0)
    max_rating = Column(Float, default=10.0)
    discovery_slider = Column(Float, default=0.5)  # 0.0 (Familiar) to 1.0 (Discover)
    preferred_era = Column(Text, default="[]")  # JSON array e.g. ["2010-2020", "2020+"]
    favorite_movies = Column(Text, default="[]")  # JSON array of movie IDs
    onboarding_completed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="preferences")


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    genres = Column(Text, nullable=False)  # JSON array e.g. ["Sci-Fi", "Action"]
    language = Column(String(50), default="English", index=True)
    rating = Column(Float, default=7.5, index=True)
    vote_count = Column(Integer, default=1000)
    overview = Column(Text, nullable=False)
    poster_path = Column(String(500), nullable=True)
    backdrop_path = Column(String(500), nullable=True)
    director = Column(String(100), default="Unknown")
    cast_members = Column(Text, default="[]")  # JSON array
    keywords = Column(Text, default="[]")  # JSON array
    popularity = Column(Float, default=50.0, index=True)
    emotional_vibes = Column(Text, default="[]")  # JSON array e.g. ["uplifting", "thrilling", "mind-bending"]


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    rating = Column(Float, nullable=False)  # 1.0 to 10.0
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ratings")
    movie = relationship("Movie")

    __table_args__ = (
        Index("idx_user_movie_rating", "user_id", "movie_id", unique=True),
    )


class UserInteraction(Base):
    __tablename__ = "user_movie_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False)  # LIKE, DISLIKE, RATING, WATCHLIST, CLICK, VIEW_DETAILS, NOT_INTERESTED, SEARCH
    weight = Column(Float, default=1.0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="interactions")
    movie = relationship("Movie")

    __table_args__ = (
        Index("idx_user_movie_interaction", "user_id", "movie_id"),
    )


class Watchlist(Base):
    __tablename__ = "user_watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    is_watched = Column(Boolean, default=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="watchlist")
    movie = relationship("Movie")

    __table_args__ = (
        Index("idx_user_movie_watchlist", "user_id", "movie_id", unique=True),
    )


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    content_score = Column(Float, default=0.0)
    collaborative_score = Column(Float, default=0.0)
    genre_score = Column(Float, default=0.0)
    language_score = Column(Float, default=0.0)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
    movie = relationship("Movie")
