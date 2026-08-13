import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Star, Film } from 'lucide-react';
import { interactionAPI } from '../services/api';
import type { Movie } from '../types';

export const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const data = await interactionAPI.getWatchlist();
      setWatchlist(data);
    } catch (e) {
      console.error("Failed to load watchlist", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (movieId: number) => {
    await interactionAPI.removeFromWatchlist(movieId);
    setWatchlist(watchlist.filter((m) => m.id !== movieId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
          <Bookmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Personal Watchlist</h1>
          <p className="text-xs text-slate-400 mt-1">Saved titles strictly associated with your authenticated account.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading watchlist...</div>
      ) : watchlist.length === 0 ? (
        <div className="text-center p-16 glass-panel rounded-3xl border border-slate-800 space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your Watchlist is empty</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Browse recommendations and click the bookmark icon on any movie card to save it to your private list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((movie) => (
            <div key={movie.id} className="glass-panel p-4 rounded-2xl border border-slate-800 flex gap-4 items-center">
              <img src={movie.poster_path} alt={movie.title} className="w-20 h-28 object-cover rounded-xl bg-slate-900" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-white text-sm truncate">{movie.title}</h3>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {movie.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{movie.overview}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {movie.year}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {movie.language}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRemove(movie.id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                title="Remove from Watchlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
