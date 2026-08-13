import React, { useState } from 'react';
import { Star, Heart, Bookmark, Info, Sparkles, Check } from 'lucide-react';
import type { MovieRecommendation } from '../types';

interface MovieCardProps {
  movie: MovieRecommendation;
  onSelect: (movie: MovieRecommendation) => void;
  onLike: (movieId: number) => void;
  onWatchlistToggle: (movieId: number) => void;
  isLiked?: boolean;
  isInWatchlist?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  onLike,
  onWatchlistToggle,
  isLiked = false,
  isInWatchlist = false
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    onLike(movie.id);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInWatchlist(!inWatchlist);
    onWatchlistToggle(movie.id);
  };

  return (
    <div
      onClick={() => onSelect(movie)}
      className="group relative bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col h-full"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        <img
          src={movie.poster_path}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
          }}
        />

        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-indigo-500/40 shadow-md">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="text-xs font-extrabold text-indigo-300">{movie.match_score}% Match</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-bold shadow-md">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{movie.rating}</span>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="flex items-center justify-between w-full gap-2">
            <button
              onClick={handleLikeClick}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                liked
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:text-rose-400 hover:bg-slate-800'
              }`}
              title={liked ? "Liked" : "Like Movie"}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={handleWatchlistClick}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                inWatchlist
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:text-indigo-400 hover:bg-slate-800'
              }`}
              title={inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onSelect(movie)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              Details
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-white text-base truncate group-hover:text-indigo-300 transition-colors">
              {movie.title}
            </h3>
            <span className="text-xs text-slate-400 font-medium">{movie.year}</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {movie.genres.slice(0, 2).map((g) => (
              <span key={g} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {g}
              </span>
            ))}
            {movie.genres.length > 2 && (
              <span className="text-[10px] text-slate-500">+{movie.genres.length - 2}</span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 italic border-t border-slate-800/80 pt-2 mt-2">
          "{movie.explanation}"
        </p>
      </div>

    </div>
  );
};
