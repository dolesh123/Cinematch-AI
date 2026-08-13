import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Gem, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recommendationAPI, interactionAPI } from '../services/api';
import type { MovieRecommendation, Movie } from '../types';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { MoodSearchHeader } from '../components/MoodSearchHeader';
import { AIProcessingLoader } from '../components/AIProcessingLoader';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [moodLoading, setMoodLoading] = useState<boolean>(false);
  const [activeMoodPrompt, setActiveMoodPrompt] = useState<string>('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const recs = await recommendationAPI.getRecommendations();
      setRecommendations(recs);

      const wl = await interactionAPI.getWatchlist();
      setWatchlist(wl);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSearchMood = async (prompt: string) => {
    setMoodLoading(true);
    setActiveMoodPrompt(prompt);
    try {
      const moodRecs = await recommendationAPI.getMoodRecommendations(prompt);
      setRecommendations(moodRecs);
    } catch (e) {
      console.error("Failed to fetch mood recommendations", e);
    } finally {
      setMoodLoading(false);
    }
  };

  const handleClearMood = () => {
    setActiveMoodPrompt('');
    loadDashboardData();
  };

  const handleLike = async (movieId: number) => {
    await interactionAPI.submitFeedback(movieId, 'LIKE');
    recommendationAPI.getRecommendations().then((res) => setRecommendations(res));
  };

  const handleWatchlistToggle = async (movieId: number) => {
    await interactionAPI.toggleWatchlist(movieId);
    const wl = await interactionAPI.getWatchlist();
    setWatchlist(wl);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const topPicked = recommendations.slice(0, 6);
  const becauseYouLiked = recommendations.filter((r) => r.explanation.includes('because you liked') || r.explanation.includes('Matches')).slice(0, 4);
  const hiddenGems = recommendations.filter((r) => r.rating >= 8.0 && r.popularity < 95.0).slice(0, 4);
  const trendingForYou = recommendations.filter((r) => r.popularity >= 90.0).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {getTimeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{user?.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here are movies custom-ranked for <strong className="text-slate-200">your authenticated taste profile</strong>.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Recommendations
        </button>
      </div>

      <MoodSearchHeader
        onSearchMood={handleSearchMood}
        isLoading={moodLoading}
        activePrompt={activeMoodPrompt}
        onClearMood={handleClearMood}
      />

      {loading || moodLoading ? (
        <AIProcessingLoader />
      ) : (
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Movies Picked For You</h2>
                <p className="text-xs text-slate-400">Personalized hybrid recommendations (TF-IDF + SVD)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {topPicked.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={setSelectedMovie}
                  onLike={handleLike}
                  onWatchlistToggle={handleWatchlistToggle}
                  isInWatchlist={watchlist.some((w) => w.id === movie.id)}
                />
              ))}
            </div>
          </section>

          {becauseYouLiked.length > 0 && (
            <section className="pt-6 border-t border-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Because You Liked...</h2>
                  <p className="text-xs text-slate-400">Content similarity matching your recent interaction history</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {becauseYouLiked.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={setSelectedMovie}
                    onLike={handleLike}
                    onWatchlistToggle={handleWatchlistToggle}
                    isInWatchlist={watchlist.some((w) => w.id === movie.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {trendingForYou.length > 0 && (
            <section className="pt-6 border-t border-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Trending For You</h2>
                  <p className="text-xs text-slate-400">Global trending titles filtered through your genre preferences</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {trendingForYou.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={setSelectedMovie}
                    onLike={handleLike}
                    onWatchlistToggle={handleWatchlistToggle}
                    isInWatchlist={watchlist.some((w) => w.id === movie.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {hiddenGems.length > 0 && (
            <section className="pt-6 border-t border-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <Gem className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Hidden Gems For You</h2>
                  <p className="text-xs text-slate-400">Critically acclaimed films tailored to your specific taste profile</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {hiddenGems.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={setSelectedMovie}
                    onLike={handleLike}
                    onWatchlistToggle={handleWatchlistToggle}
                    isInWatchlist={watchlist.some((w) => w.id === movie.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onLike={handleLike}
        onWatchlistToggle={handleWatchlistToggle}
      />
    </div>
  );
};
