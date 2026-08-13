export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  preferred_genres: string[];
  preferred_languages: string[];
  min_rating: number;
  max_rating: number;
  discovery_slider: number;
  preferred_era: string[];
  favorite_movies: number[];
  onboarding_completed: boolean;
}

export interface Movie {
  id: number;
  title: string;
  year: number;
  genres: string[];
  language: string;
  rating: number;
  vote_count: number;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  director: string;
  cast_members: string[];
  keywords: string[];
  popularity: number;
  emotional_vibes: string[];
}

export interface MovieRecommendation extends Movie {
  match_score: number;
  content_score: number;
  collaborative_score: number;
  genre_score: number;
  language_score: number;
  explanation: string;
  explanation_details: Record<string, number>;
}

export interface GenreAffinity {
  genre: string;
  score: number;
  percentage: number;
}

export interface TasteProfile {
  user_name: string;
  total_interactions: number;
  total_ratings_given: number;
  avg_rating_given: number;
  top_genres: GenreAffinity[];
  preferred_languages: string[];
  recent_activity: Array<{
    movie_title: string;
    action: string;
    timestamp: string;
  }>;
  personalized_insights: string[];
}

export interface MLMetrics {
  precision_at_k: number;
  recall_at_k: number;
  f1_at_k: number;
  map_at_k: number;
  ndcg_at_k: number;
  rmse: number;
  evaluated_users_count: number;
  dataset_movies_count: number;
  dataset_ratings_count: number;
}

export interface AdminAnalytics {
  total_users: number;
  total_movies: number;
  total_ratings: number;
  total_interactions: number;
  active_users_last_24h: number;
  recommendation_acceptance_rate: number;
  avg_recommendation_latency_ms: number;
  ml_metrics: MLMetrics;
}
