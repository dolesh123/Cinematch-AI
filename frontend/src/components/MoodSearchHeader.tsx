import React, { useState } from 'react';
import { Sparkles, Search, Smile, HeartHandshake, Zap, Compass, RefreshCw } from 'lucide-react';

interface MoodSearchHeaderProps {
  onSearchMood: (prompt: string) => void;
  isLoading: boolean;
  activePrompt: string;
  onClearMood: () => void;
}

export const MoodSearchHeader: React.FC<MoodSearchHeaderProps> = ({
  onSearchMood,
  isLoading,
  activePrompt,
  onClearMood
}) => {
  const [inputPrompt, setInputPrompt] = useState('');

  const quickMoodPresets = [
    { label: '😭 "I am sad & need uplifting"', prompt: 'I am sad and need an uplifting feel-good movie', icon: Smile, color: 'hover:border-amber-500/50 hover:bg-amber-950/20 text-amber-300' },
    { label: '💖 "I would like to watch a romcom"', prompt: 'I would like to watch a romantic comedy', icon: HeartHandshake, color: 'hover:border-rose-500/50 hover:bg-rose-950/20 text-rose-300' },
    { label: '🤯 "Mind-bending sci-fi thriller"', prompt: 'Looking for a mind-bending sci-fi thriller with plot twists', icon: Zap, color: 'hover:border-indigo-500/50 hover:bg-indigo-950/20 text-indigo-300' },
    { label: '🧘 "Stressed & need to unwind"', prompt: 'I am stressed after a long day and want a comforting animated movie', icon: Compass, color: 'hover:border-emerald-500/50 hover:bg-emerald-950/20 text-emerald-300' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPrompt.trim()) {
      onSearchMood(inputPrompt.trim());
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-indigo-500/20 shadow-2xl mb-8">
      
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          LLM Natural Language & Mood Engine
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          How are you feeling right now?
        </h2>
        <p className="text-sm text-slate-400 mt-1 mb-6">
          Enter any mood or request (e.g. <span className="text-slate-200 italic">"I am sad"</span>, <span className="text-slate-200 italic">"I want a feel-good romcom"</span>) and Gemini AI will re-rank your recommendation pipeline in real-time.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="e.g. 'I am feeling low and want something cozy' or 'I would like to watch a romcom'"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Recommend
              </>
            )}
          </button>
        </form>

        {/* Active Mood Pill Banner */}
        {activePrompt && (
          <div className="flex items-center justify-between bg-indigo-950/60 border border-indigo-500/40 rounded-xl px-4 py-2.5 mb-4 text-xs">
            <div className="flex items-center gap-2 text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Active Mood Filter: <strong className="text-white">"{activePrompt}"</strong></span>
            </div>
            <button
              onClick={onClearMood}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Reset to Base Profile
            </button>
          </div>
        )}

        {/* Quick Preset Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Prompts:</span>
          {quickMoodPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputPrompt(preset.prompt);
                onSearchMood(preset.prompt);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 transition-all flex items-center gap-1.5 ${preset.color}`}
            >
              {preset.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
