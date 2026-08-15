from datetime import datetime, timezone
from typing import List, Optional, Any, Dict

class DocumentWrapper:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

    def get(self, key: str, default: Any = None) -> Any:
        return getattr(self, key, default)

    def __getitem__(self, key: str) -> Any:
        return getattr(self, key)

    def __setitem__(self, key: str, value: Any):
        setattr(self, key, value)


class User(DocumentWrapper):
    def __init__(
        self,
        id: int,
        name: str = "User",
        email: str = "",
        password_hash: str = "",
        is_admin: bool = False,
        created_at: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self._id = _id
        self.id = id
        self.name = name
        self.email = email
        self.password_hash = password_hash
        self.is_admin = is_admin
        self.created_at = created_at or datetime.now(timezone.utc)
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["User"]:
        if not doc:
            return None
        return cls(**doc)


class UserPreference(DocumentWrapper):
    def __init__(
        self,
        user_id: int,
        id: Optional[int] = None,
        preferred_genres: Optional[List[str]] = None,
        preferred_languages: Optional[List[str]] = None,
        min_rating: float = 6.0,
        max_rating: float = 10.0,
        discovery_slider: float = 0.5,
        preferred_era: Optional[List[str]] = None,
        favorite_movies: Optional[List[int]] = None,
        onboarding_completed: bool = False,
        updated_at: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self._id = _id
        self.id = id or user_id
        self.user_id = user_id
        self.preferred_genres = preferred_genres or []
        self.preferred_languages = preferred_languages or []
        self.min_rating = float(min_rating)
        self.max_rating = float(max_rating)
        self.discovery_slider = float(discovery_slider)
        self.preferred_era = preferred_era or []
        self.favorite_movies = favorite_movies or []
        self.onboarding_completed = onboarding_completed
        self.updated_at = updated_at or datetime.now(timezone.utc)
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["UserPreference"]:
        if not doc:
            return None
        return cls(**doc)


class Movie(DocumentWrapper):
    def __init__(
        self,
        id: int,
        title: str,
        year: int = 2020,
        genres: Optional[List[str]] = None,
        language: str = "English",
        rating: float = 7.5,
        vote_count: int = 1000,
        overview: str = "",
        poster_path: Optional[str] = None,
        backdrop_path: Optional[str] = None,
        director: str = "Unknown",
        cast_members: Optional[List[str]] = None,
        keywords: Optional[List[str]] = None,
        popularity: float = 50.0,
        emotional_vibes: Optional[List[str]] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self._id = _id
        self.id = id
        self.title = title
        self.year = int(year) if year else 2020
        self.genres = genres if isinstance(genres, list) else []
        self.language = language or "English"
        self.rating = float(rating) if rating is not None else 7.5
        self.vote_count = int(vote_count) if vote_count is not None else 1000
        self.overview = overview or ""
        self.poster_path = poster_path
        self.backdrop_path = backdrop_path
        self.director = director or "Unknown"
        self.cast_members = cast_members if isinstance(cast_members, list) else []
        self.keywords = keywords if isinstance(keywords, list) else []
        self.popularity = float(popularity) if popularity is not None else 50.0
        self.emotional_vibes = emotional_vibes if isinstance(emotional_vibes, list) else []
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["Movie"]:
        if not doc:
            return None
        return cls(**doc)


class Rating(DocumentWrapper):
    def __init__(
        self,
        user_id: int,
        movie_id: int,
        rating: float,
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self._id = _id
        self.id = id
        self.user_id = user_id
        self.movie_id = movie_id
        self.rating = float(rating)
        self.created_at = created_at or datetime.now(timezone.utc)
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["Rating"]:
        if not doc:
            return None
        return cls(**doc)


class UserInteraction(DocumentWrapper):
    def __init__(
        self,
        user_id: int,
        movie_id: int,
        interaction_type: str,
        weight: float = 1.0,
        id: Optional[int] = None,
        timestamp: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self._id = _id
        self.id = id
        self.user_id = user_id
        self.movie_id = movie_id
        self.interaction_type = interaction_type
        self.weight = float(weight)
        self.timestamp = timestamp or datetime.now(timezone.utc)
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["UserInteraction"]:
        if not doc:
            return None
        return cls(**doc)


class Watchlist(DocumentWrapper):
    def __init__(
        self,
        user_id: int,
        movie_id: int,
        is_watched: bool = False,
        id: Optional[int] = None,
        added_at: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self._id = _id
        self.id = id
        self.user_id = user_id
        self.movie_id = movie_id
        self.is_watched = is_watched
        self.added_at = added_at or datetime.now(timezone.utc)
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["Watchlist"]:
        if not doc:
            return None
        return cls(**doc)


class RecommendationHistory(DocumentWrapper):
    def __init__(
        self,
        user_id: int,
        movie_id: int,
        score: float,
        content_score: float = 0.0,
        collaborative_score: float = 0.0,
        genre_score: float = 0.0,
        language_score: float = 0.0,
        explanation: str = "",
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        _id: Optional[Any] = None,
        **kwargs
    ):
        self._id = _id
        self.id = id
        self.user_id = user_id
        self.movie_id = movie_id
        self.score = float(score)
        self.content_score = float(content_score)
        self.collaborative_score = float(collaborative_score)
        self.genre_score = float(genre_score)
        self.language_score = float(language_score)
        self.explanation = explanation
        self.created_at = created_at or datetime.now(timezone.utc)
        for k, v in kwargs.items():
            setattr(self, k, v)

    @classmethod
    def from_doc(cls, doc: Optional[Dict[str, Any]]) -> Optional["RecommendationHistory"]:
        if not doc:
            return None
        return cls(**doc)
