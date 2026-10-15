import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AssessmentPage from './pages/AssessmentPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import ModelsPage from './pages/ModelsPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getHealth, getAnalytics, getModels } from './services/api';
import { Lock, LogIn, UserPlus } from 'lucide-react';

function ProtectedPrompt({ tabName, onSignIn, onRegister }) {
  return (
    <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
        <Lock className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Authentication Required</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
          Please sign in to access <strong>{tabName}</strong>. Authenticated sessions enable personalized prediction history, private audit logs, and user-specific analytics.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-3">
        <button
          onClick={onSignIn}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>
        <button
          onClick={onRegister}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Create Free Account
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [healthStatus, setHealthStatus] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [modelsInfo, setModelsInfo] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Load system health
  const fetchHealth = useCallback(async () => {
    try {
      const data = await getHealth();
      setHealthStatus(data);
    } catch (err) {
      console.warn('Backend health check error:', err.message);
      setHealthStatus({
        status: 'disconnected',
        database_connected: false,
        model_ready: false,
      });
    }
  }, []);

  // Load analytics (user-scoped when authenticated)
  const fetchAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const data = await getAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.warn('Analytics fetch error:', err.message);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  // Load models info
  const fetchModels = useCallback(async () => {
    try {
      const data = await getModels();
      setModelsInfo(data);
    } catch (err) {
      console.warn('Models fetch error:', err.message);
    }
  }, []);

  // Refresh data on mount or when auth state changes
  useEffect(() => {
    fetchHealth();
    fetchAnalytics();
    fetchModels();

    const interval = setInterval(() => {
      fetchHealth();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchHealth, fetchAnalytics, fetchModels, isAuthenticated]);

  // Handler when prediction completes
  const handlePredictionSuccess = () => {
    fetchAnalytics();
    fetchHealth();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={healthStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'home' && (
          <HomePage
            setActiveTab={setActiveTab}
            analyticsData={analyticsData}
            healthStatus={healthStatus}
          />
        )}

        {activeTab === 'assess' && (
          isAuthenticated ? (
            <AssessmentPage
              onPredictionSuccess={handlePredictionSuccess}
              modelsInfo={modelsInfo}
              onNavigateTab={setActiveTab}
            />
          ) : (
            <ProtectedPrompt
              tabName="Produce Assessment"
              onSignIn={() => setActiveTab('login')}
              onRegister={() => setActiveTab('register')}
            />
          )
        )}

        {activeTab === 'analytics' && (
          isAuthenticated ? (
            <AnalyticsPage
              analyticsData={analyticsData}
              onRefresh={fetchAnalytics}
              isLoading={isAnalyticsLoading}
            />
          ) : (
            <ProtectedPrompt
              tabName="Quality Analytics"
              onSignIn={() => setActiveTab('login')}
              onRegister={() => setActiveTab('register')}
            />
          )
        )}

        {activeTab === 'history' && (
          isAuthenticated ? (
            <HistoryPage
              onHistoryChange={fetchAnalytics}
            />
          ) : (
            <ProtectedPrompt
              tabName="Prediction History"
              onSignIn={() => setActiveTab('login')}
              onRegister={() => setActiveTab('register')}
            />
          )
        )}

        {activeTab === 'models' && (
          <ModelsPage
            modelsInfo={modelsInfo}
            onRefresh={() => {
              fetchModels();
              fetchHealth();
            }}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage />
        )}

        {activeTab === 'login' && (
          <LoginPage
            onNavigateRegister={() => setActiveTab('register')}
            onLoginSuccess={() => setActiveTab('assess')}
            onContinueGuest={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'register' && (
          <RegisterPage
            onNavigateLogin={() => setActiveTab('login')}
            onRegisterSuccess={() => setActiveTab('assess')}
            onContinueGuest={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Standard Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-medium text-slate-400">
            Food Quality Classification Project &bull; Automated Visual Quality Assessment
          </p>
          <p className="text-[11px] text-slate-600">
            Built with React 18, Tailwind CSS, FastAPI, SQLite, and TensorFlow / Keras 3.
            Visual inspection is intended for academic and assistive quality screening only.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
