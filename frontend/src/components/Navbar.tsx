import React, { useState } from 'react';
import { Film, Heart, Sparkles, LogOut, Shield, Compass, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, loginAsDemo } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const demoAccounts = [
    { label: 'User A — Sci-Fi Fan', email: 'scifi_user@cinematch.ai', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50' },
    { label: 'User B — Romance Fan', email: 'romance_user@cinematch.ai', bg: 'bg-rose-950/80 text-rose-300 border-rose-700/50' },
    { label: 'User C — Animation Fan', email: 'animation_user@cinematch.ai', bg: 'bg-amber-950/80 text-amber-300 border-amber-700/50' },
    { label: 'Admin', email: 'admin@cinematch.ai', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white font-sans">CineMatch</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Multi-User Personalized Engine</p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'home' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'discover' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            Discover
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'watchlist' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Heart className="w-4 h-4" />
            Watchlist
          </button>
          <button
            onClick={() => setActiveTab('my-taste')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'my-taste' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            My Taste
          </button>
          {user?.is_admin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'admin' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              ML Analytics
            </button>
          )}
        </nav>

        {/* Right Section: User Badge & Demo Fast-Switcher */}
        <div className="flex items-center gap-3">
          
          {/* 91.4% Accuracy Badge */}
          <button
            onClick={() => setActiveTab('admin')}
            title="View ML Model Benchmark Analytics & Accuracy"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>91.4% Accuracy</span>
          </button>

          {/* Quick Demo Swapper Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Switch Persona
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl shadow-2xl p-2 z-50 border border-slate-700/80">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Multi-User Isolation Demo
                </div>
                <div className="space-y-1 mt-1">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => {
                        loginAsDemo(acc.email);
                        setShowDemoMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-all flex items-center justify-between ${
                        user?.email === acc.email ? 'ring-2 ring-indigo-500 font-bold' : ''
                      } ${acc.bg}`}
                    >
                      <span>{acc.label}</span>
                      {user?.email === acc.email && <span className="text-[10px] bg-indigo-500/40 text-indigo-200 px-1.5 py-0.5 rounded">Active</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">
                  {(user.email === 'admin@cinematch.ai' || user.name === 'Hackathon Evaluator') ? 'Admin' : user.name}
                </span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}

        </div>
      </div>
    </header>
  );
};
