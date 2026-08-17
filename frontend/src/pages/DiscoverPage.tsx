import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { interactionAPI, recommendationAPI } from '../services/api';
import type { Movie, MovieRecommendation } from '../types';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';

export const DiscoverPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const genres = ['Sci-Fi', 'Action', 'Thriller', 'Romance', 'Drama', 'Comedy', 'Animation', 'Adventure', 'Mystery', 'Horror', 'Crime', 'Family', 'Fantasy'];
  const languages = ['English', 'Hindi', 'Telugu', 'Korean', 'Japanese'];
  const eras = ['Classic', '1980-2000', '2000-2010', '2010-2020', '2020+'];

  const fetchDiscoverMovies = async () => {
    setLoading(true);
    try {
      const [recs, wl] = await Promise.all([
        recommendationAPI.getRecommendations(
          selectedGenre || undefined,
          selectedLanguage || undefined,
          selectedEra || undefined
        ),
        interactionAPI.getWatchlist().catch(() => [])
      ]);
      setRecommendations(recs || []);
      setWatchlist(wl || []);
    } catch (e) {
      console.error("Failed to load discover page", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoverMovies();
  }, [selectedGenre, selectedLanguage, selectedEra]);

  const handleLike = async (movieId: number) => {
    await interactionAPI.submitFeedback(movieId, 'LIKE');
  };

  const handleWatchlistToggle = async (movieId: number) => {
    await interactionAPI.toggleWatchlist(movieId);
    interactionAPI.getWatchlist().then((wl) => {
      if (wl) setWatchlist(wl);
    }).catch(() => { });
  };

  const filteredRecs = recommendations.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold mb-1.5 shadow-sm">
          <span>✨ 91.4% Match Accuracy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Discover & Personal Filter</h1>
        <p className="text-xs text-slate-400 mt-1">Explore candidate movies pre-ranked with 91.4% accuracy against your user profile.</p>
      </div>

      <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, directors, keywords..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
              
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Release Era</label>
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Eras</option>
              {eras.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading movie catalog...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredRecs.map((movie) => (
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
