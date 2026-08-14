import React, { useState } from 'react';
import { X, Star, Heart, Bookmark, Sparkles, Check, Clapperboard, Users } from 'lucide-react';
import type { MovieRecommendation } from '../types';

interface MovieModalProps {
  movie: MovieRecommendation | null;
  onClose: () => void;
  onLike: (movieId: number) => void;
  onWatchlistToggle: (movieId: number) => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  onClose,
  onLike,
  onWatchlistToggle
}) => {
  if (!movie) return null;

  const [liked, setLiked] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike(movie.id);
  };

  const handleWatchlist = () => {
    setInWatchlist(!inWatchlist);
    onWatchlistToggle(movie.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/70 text-slate-400 hover:text-white border border-slate-700 backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-64 sm:h-72 w-full bg-slate-950">
          <img
            src={movie.backdrop_path || movie.poster_path}
            alt={movie.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-50"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-extrabold text-xs shadow-md flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {movie.match_score}% Match
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                  {movie.year}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {movie.rating} / 10
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-2 ${
                  liked
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                    : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-white' : ''}`} />
                {liked ? 'Liked' : 'Like'}
              </button>

              <button
                onClick={handleWatchlist}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-2 ${
                  inWatchlist
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {inWatchlist ? 'Saved' : 'Watchlist'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Why CineMatch AI picked this for you
            </div>
            <p className="text-sm text-slate-200 font-medium mb-3 italic">
              "{movie.explanation}"
            </p>

            {movie.explanation_details && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-indigo-900/40">
                {Object.entries(movie.explanation_details).map(([key, val]) => (
                  <div key={key} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block truncate">{key}</span>
                    <div className="flex items-center justify-between mt-1">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mr-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full"
                          style={{ width: `${val}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-indigo-300">{val}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Synopsis</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{movie.overview}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-start gap-3">
              <Clapperboard className="w-5 h-5 text-indigo-400 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block font-medium">Director</span>
                <span className="text-sm font-bold text-slate-200">{movie.director}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-indigo-400 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block font-medium">Cast Members</span>
                <span className="text-sm font-semibold text-slate-200">{movie.cast_members.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <span key={g} className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                {g}
              </span>
            ))}
            {movie.emotional_vibes?.map((v) => (
              <span key={v} className="px-3 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 text-xs font-semibold border border-indigo-800/50">
                #{v}
              </span>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
