import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, Search, Star, Sliders } from 'lucide-react';
import { movieAPI, preferenceAPI } from '../services/api';
import type { Movie } from '../types';
import { useAuth } from '../context/AuthContext';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Sci-Fi', 'Thriller']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [minRating, setMinRating] = useState<number>(7.0);
  const [discoverySlider, setDiscoverySlider] = useState<number>(0.5);
  const [saving, setSaving] = useState(false);

  const availableGenres = ['Sci-Fi', 'Action', 'Thriller', 'Romance', 'Drama', 'Comedy', 'Animation', 'Adventure', 'Mystery', 'Crime', 'Family'];
  const availableLanguages = ['English', 'Hindi', 'Telugu', 'Korean', 'Japanese'];

  useEffect(() => {
    movieAPI.searchMovies('').then((res) => setAllMovies(res));
  }, []);

  const toggleMovieSelect = (id: number) => {
    if (selectedMovies.includes(id)) {
      setSelectedMovies(selectedMovies.filter((mId) => mId !== id));
    } else {
      if (selectedMovies.length < 10) {
        setSelectedMovies([...selectedMovies, id]);
      }
    }
  };

  const toggleChip = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFinishOnboarding = async () => {
    setSaving(true);
    try {
      await preferenceAPI.updatePreferences({
        preferred_genres: selectedGenres,
        preferred_languages: selectedLanguages,
        min_rating: minRating,
        discovery_slider: discoverySlider,
        preferred_era: [],
        favorite_movies: selectedMovies,
        onboarding_completed: true
      });
      await refreshUser();
      onComplete();
    } catch (e) {
      console.error("Failed to complete onboarding", e);
    } finally {
      setSaving(false);
    }
  };

  const filteredMovies = allMovies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Step {step} of 3</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Let's understand your taste.</h1>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${
                  s === step ? 'w-8 bg-indigo-500 shadow-md shadow-indigo-500/50' : s < step ? 'bg-indigo-900' : 'bg-slate-800'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* STEP 1: Select 3-10 Favorite Movies */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Select 3 to 10 movies you've loved:</h2>
              <p className="text-xs text-slate-400 mt-1">This forms the initial seed cluster for your personalized content vector model.</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog for favorite movies..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Selected Counter */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Selected: <strong className="text-indigo-400 font-bold">{selectedMovies.length}</strong> / 10 (Minimum 3 recommended)</span>
              {selectedMovies.length >= 3 && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready for next step!
                </span>
              )}
            </div>

            {/* Movie Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredMovies.map((movie) => {
                const isSelected = selectedMovies.includes(movie.id);
                return (
                  <div
                    key={movie.id}
                    onClick={() => toggleMovieSelect(movie.id)}
                    className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 aspect-[2/3] ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500 scale-95 shadow-xl'
                        : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={movie.poster_path}
                      alt={movie.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-2 flex flex-col justify-between">
                      <div className="flex justify-end">
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight truncate">{movie.title}</span>
                        <span className="text-[10px] text-slate-400">{movie.year}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={selectedMovies.length < 1}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Genres & Languages */}
        {step === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Select your favorite genres & languages:</h2>
              <p className="text-xs text-slate-400 mt-1">We balance these genre preferences against your collaborative filtering matrix.</p>
            </div>

            {/* Genres Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Favorite Genres</label>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => {
                  const active = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleChip(genre, selectedGenres, setSelectedGenres)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Languages Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Preferred Languages</label>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((lang) => {
                  const active = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => toggleChip(lang, selectedLanguages, setSelectedLanguages)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-bold border border-slate-800"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Rating Slider & Exploration Mode */}
        {step === 3 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Fine-tune your recommendation algorithm:</h2>
              <p className="text-xs text-slate-400 mt-1">Control discovery bias and minimum rating thresholds.</p>
            </div>

            {/* Minimum Rating Slider */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Minimum Rating Threshold
                </label>
                <span className="text-base font-extrabold text-indigo-400">{minRating} / 10</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="9.0"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-semibold">
                <span>5.0 (All Ratings)</span>
                <span>7.5 (High Quality)</span>
                <span>9.0 (Masterpieces Only)</span>
              </div>
            </div>

            {/* Content Preference Slider (Familiar vs Discover) */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Discovery Bias Slider
                </label>
                <span className="text-xs font-bold text-indigo-400">
                  {discoverySlider < 0.4 ? 'Familiar (Safe Picks)' : discoverySlider > 0.6 ? 'Discover (Serendipity)' : 'Balanced'}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={discoverySlider}
                onChange={(e) => setDiscoverySlider(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-semibold">
                <span>Familiar ← Strictly In Taste</span>
                <span>→ Discover (Exploratory)</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-bold border border-slate-800"
              >
                Back
              </button>
              <button
                onClick={handleFinishOnboarding}
                disabled={saving}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Configuring Profile...' : 'Build My Recommendations'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
