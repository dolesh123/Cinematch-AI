import axios from 'axios';
import { safeStorage } from './storage';
import type {
  User, UserPreferences, Movie, MovieRecommendation,
  TasteProfile, AdminAnalytics, MLMetrics
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = safeStorage.getItem('cinematch_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    safeStorage.removeItem('cinematch_token');
    safeStorage.removeItem('cinematch_user');
  }
};

export const preferenceAPI = {
  getPreferences: async (): Promise<UserPreferences> => {
    const res = await api.get('/preferences');
    return res.data;
  },
  updatePreferences: async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
    const res = await api.put('/preferences', data);
    return res.data;
  }
};

export const movieAPI = {
  searchMovies: async (query?: string, genre?: string, language?: string): Promise<Movie[]> => {
    const res = await api.get('/movies/search', {
      params: { q: query, genre, language }
    });
    return res.data;
  },
  getMovieDetail: async (id: number): Promise<Movie> => {
    const res = await api.get(`/movies/${id}`);
    return res.data;
  }
};

export const recommendationAPI = {
  getRecommendations: async (genre?: string, language?: string, era?: string): Promise<MovieRecommendation[]> => {
    const res = await api.get('/recommendations', {
      params: { genre, language, era }
    });
    return res.data;
  },
  getMoodRecommendations: async (prompt: string): Promise<MovieRecommendation[]> => {
    const res = await api.post('/recommendations/mood', { prompt });
    return res.data;
  }
};

export const interactionAPI = {
  submitFeedback: async (movieId: number, interactionType: string, ratingValue?: number) => {
    const res = await api.post('/feedback', {
      movie_id: movieId,
      interaction_type: interactionType,
      rating_value: ratingValue
    });
    return res.data;
  },
  getWatchlist: async (): Promise<Movie[]> => {
    const res = await api.get('/watchlist');
    return res.data;
  },
  toggleWatchlist: async (movieId: number) => {
    const res = await api.post('/watchlist', { movie_id: movieId });
    return res.data;
  },
  removeFromWatchlist: async (movieId: number) => {
    const res = await api.delete(`/watchlist/${movieId}`);
    return res.data;
  }
};

export const analyticsAPI = {
  getTasteProfile: async (): Promise<TasteProfile> => {
    const res = await api.get('/my-taste');
    return res.data;
  },
  getMLMetrics: async (): Promise<MLMetrics> => {
    const res = await api.get('/model/metrics');
    return res.data;
  },
  getAdminAnalytics: async (): Promise<AdminAnalytics> => {
    const res = await api.get('/admin/analytics');
    return res.data;
  }
};

export default api;
