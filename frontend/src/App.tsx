import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { safeStorage } from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { MyTastePage } from './pages/MyTastePage';
import { AdminPage } from './pages/AdminPage';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<string>('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing CineMatch AI...
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    if (authMode === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthMode('register')} />;
    } else {
      return <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />;
    }
  }

  // First-Time Onboarding Guard
  if (!user.onboarding_completed) {
    return <OnboardingPage onComplete={() => setActiveTab('home')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'discover' && <DiscoverPage />}
        {activeTab === 'watchlist' && <WatchlistPage />}
        {activeTab === 'my-taste' && <MyTastePage />}
        {activeTab === 'admin' && <AdminPage />}
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 glass-panel">
        <p>CineMatch AI — Built for Cognizant NPN AIA Hackathon 2026. Absolute Multi-User Isolation Engine.</p>
      </footer>
    </div>
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    safeStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
