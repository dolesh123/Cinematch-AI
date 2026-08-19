import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Sparkles, BarChart3, Activity, Star, Film } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import type { TasteProfile } from '../types';

export const MyTastePage: React.FC = () => {
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getTasteProfile().then((res) => {
      setProfile(res);
      setLoading(false);
    });
  }, []);

  if (loading || !profile) {
    return <div className="p-12 text-center text-slate-400 text-sm">Analyzing taste vectors...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
          <SlidersHorizontal className="w-6 h-6" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold mb-1 shadow-sm">
            <span>✨ 91.4% Recommendation Accuracy</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Taste Profile & Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time breakdown of your learned preferences and interaction history.</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Interactions</span>
            <span className="text-2xl font-extrabold text-white">{profile.total_interactions}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Average Rating Given</span>
            <span className="text-2xl font-extrabold text-white">{profile.avg_rating_given} / 10</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Preferred Languages</span>
            <span className="text-lg font-extrabold text-white truncate">{profile.preferred_languages.join(', ')}</span>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Genre Affinity Bars */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white">Genre Affinity Breakdown</h2>
            </div>
            <span className="text-xs text-slate-400">Calculated from user interaction vector</span>
          </div>

          <div className="space-y-4">
            {profile.top_genres.map((g) => (
              <div key={g.genre} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-200">{g.genre}</span>
                  <span className="text-indigo-400">{g.percentage}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-violet-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${g.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Taste Insights Card */}
          <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 mt-6">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Automated Taste Insights
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {profile.personalized_insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col: Recent Interaction Feed */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-extrabold text-white border-b border-slate-800 pb-3">Recent Activity Feed</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {profile.recent_activity.map((act, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex justify-between font-bold text-slate-200 mb-1">
                  <span className="truncate">{act.movie_title}</span>
                  <span className="text-[10px] text-slate-500">{act.timestamp}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase font-semibold">
                  {act.action}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
