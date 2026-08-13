import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
