import React, { useState } from 'react';
import { X, Star, Heart, Bookmark, Sparkles, Check, Clapperboard, Users } from 'lucide-react';
import type { MovieRecommendation } from '../types';
import { handleImageError } from '../utils/imageFallback';

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

  // Primary authentic image URL for the movie
  const primaryImage = movie.poster_path || movie.backdrop_path || '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-slate-950/70 text-slate-400 hover:text-white border border-slate-700 backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Hero Header with Matching Ambient Background & Crisp Poster */}
        <div className="relative min-h-[220px] sm:min-h-[260px] w-full bg-slate-950 overflow-hidden flex items-end p-6">
          
          {/* Ambient Blurred Backdrop using the Exact Movie Poster */}
          <img
            src={primaryImage}
            alt={movie.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-40 transition-all duration-500"
            onError={(e) => handleImageError(e, movie.title, movie.year, movie.genres, movie.director)}
          />

          {/* Gradient Overlay for Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20"></div>

          {/* Header Content with Authentic Poster & Metadata */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end gap-5 w-full">
            
            {/* Crisp Movie Poster Thumbnail */}
            <div className="w-24 sm:w-28 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900">
              <img
                src={primaryImage}
                alt={movie.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, movie.title, movie.year, movie.genres, movie.director)}
              />
            </div>

            {/* Title, Match Badge & Action Buttons */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
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

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {movie.title}
              </h2>
            </div>

            {/* Like & Watchlist Actions */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-end">
              <button
                onClick={handleLike}
                className={`px-4 py-2 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 ${
                  liked
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                    : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-white' : ''}`} />
                {liked ? 'Liked' : 'Like'}
              </button>

              <button
                onClick={handleWatchlist}
                className={`px-4 py-2 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 ${
                  inWatchlist
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {inWatchlist ? 'Saved' : 'Watchlist'}
              </button>
            </div>

          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* AI Recommendation Explanation */}
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

          {/* Synopsis */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Synopsis</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{movie.overview}</p>
          </div>

          {/* Director & Cast */}
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

          {/* Genre & Vibes Chips */}
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
