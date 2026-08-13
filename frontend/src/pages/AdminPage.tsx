import React, { useState, useEffect } from 'react';
import { Shield, Cpu } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import type { AdminAnalytics } from '../types';

export const AdminPage: React.FC = () => {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getAdminAnalytics().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading ML Model Benchmark Analytics...</div>;
  }

  const m = data.ml_metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="p-3 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin & ML Model Evaluation Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time benchmark evaluation and system latency statistics for hackathon judges.</p>
        </div>
      </div>

      {/* Dataset & System Health Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Catalog Movies</span>
          <span className="text-2xl font-extrabold text-white">{data.total_movies}</span>
          <span className="text-[10px] text-emerald-400 block mt-1">TF-IDF Vectorized</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Total Ratings</span>
          <span className="text-2xl font-extrabold text-white">{data.total_ratings}</span>
          <span className="text-[10px] text-indigo-400 block mt-1">SVD Matrix Factorized</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Interaction Events</span>
          <span className="text-2xl font-extrabold text-white">{data.total_interactions}</span>
          <span className="text-[10px] text-violet-400 block mt-1">Recency Weighted</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Avg Rec Latency</span>
          <span className="text-2xl font-extrabold text-emerald-400">{data.avg_recommendation_latency_ms} ms</span>
          <span className="text-[10px] text-slate-500 block mt-1">Target &lt; 2000 ms</span>
        </div>

      </div>

      {/* Real Model Benchmark Evaluation Metrics Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white">Model Benchmark Metrics (Hold-out Test Set)</h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Real Evaluated Data
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">Precision@5</span>
            <span className="text-2xl font-black text-indigo-400">{(m.precision_at_k * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">Recall@5</span>
            <span className="text-2xl font-black text-violet-400">{(m.recall_at_k * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">F1-Score@5</span>
            <span className="text-2xl font-black text-rose-400">{(m.f1_at_k * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">MAP@5</span>
            <span className="text-2xl font-black text-amber-400">{(m.map_at_k * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">NDCG@5</span>
            <span className="text-2xl font-black text-emerald-400">{(m.ndcg_at_k * 100).toFixed(1)}%</span>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">RMSE (Rating)</span>
            <span className="text-2xl font-black text-cyan-400">{m.rmse.toFixed(3)}</span>
          </div>

        </div>

        {/* Model Architecture Summary */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="font-bold text-white uppercase tracking-wider mb-1">Recommendation Architecture Pipeline:</div>
          <div>• <strong>Content Model</strong>: TF-IDF vectorizer over titles, directors, cast, genres, overview text, and emotional vibes (Cosine Similarity).</div>
          <div>• <strong>Collaborative Model</strong>: Truncated SVD Matrix Factorization trained on sparse rating matrices.</div>
          <div>• <strong>Dynamic Personalization</strong>: Exponential recency weighting exp(-λ · Δt) over user interaction history.</div>
          <div>• <strong>LLM Mood Parser</strong>: Gemini AI natural language intent parser translating prompt queries into mood target vectors.</div>
        </div>

      </div>

    </div>
  );
};
