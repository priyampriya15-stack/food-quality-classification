import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import AuthLayout from './components/AuthLayout';
import Footer from './components/Footer';
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
import { Lock, LogIn, UserPlus, RefreshCw } from 'lucide-react';

const getTabFromLocation = () => {
  if (typeof window === 'undefined') return 'login';
  const cleanPath = window.location.pathname.toLowerCase().replace(/^\/+/, '').replace(/\/+$/, '');
  const cleanHash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/+$/, '');
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab') || searchParams.get('route');

  const normalize = (val) => {
    if (val === undefined || val === null) return null;
    const clean = val.toLowerCase().trim();
    if (clean === 'login' || clean === 'signin' || clean === 'sign-in') return 'login';
    if (clean === 'register' || clean === 'signup' || clean === 'sign-up') return 'register';
    if (clean === 'assess' || clean === 'assessment') return 'assess';
    if (clean === 'analytics') return 'analytics';
    if (clean === 'history') return 'history';
    if (clean === 'models') return 'models';
    if (clean === 'about') return 'about';
    if (clean === 'home') return 'home';
    if (clean === '') {
      const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('food_quality_token');
      return hasToken ? 'home' : 'login';
    }
    return null;
  };

  const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('food_quality_token');
  return normalize(cleanPath) || normalize(cleanHash) || normalize(tabParam) || (hasToken ? 'home' : 'login');
};

const TAB_TITLES = {
  home: 'FoodQuality AI - Visual Quality Assessment',
  assess: 'FoodQuality AI - Produce Assessment',
  analytics: 'FoodQuality AI - Quality Analytics',
  history: 'FoodQuality AI - Prediction History',
  models: 'FoodQuality AI - Deep Learning Models',
  about: 'FoodQuality AI - Project Methodology',
  login: 'FoodQuality AI - Sign In',
  register: 'FoodQuality AI - Create Account',
};

function ProtectedPrompt({ tabName, onSignIn, onRegister }) {
  return (
    <div className="p-6 sm:p-10 md:p-12 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-8 sm:my-12 shadow-2xl">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
        <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Authentication Required</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
          Please sign in to access <strong>{tabName}</strong>. Authenticated sessions enable personalized prediction history, private audit logs, and user-specific analytics.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-3">
        <button
          onClick={onSignIn}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02] cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>
        <button
          onClick={onRegister}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Create Free Account
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, isAuthenticated, loading } = useAuth();
  const redirectTabRef = useRef(null);
  const [activeTab, setActiveTab] = useState(getTabFromLocation);
  const [healthStatus, setHealthStatus] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [modelsInfo, setModelsInfo] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const handleTabChange = useCallback((tabId) => {
    // If not authenticated, only 'login' and 'register' are allowed
    if (!isAuthenticated && tabId !== 'login' && tabId !== 'register') {
      redirectTabRef.current = tabId;
      setActiveTab('login');
      if (typeof window !== 'undefined') {
        window.history.pushState({ tab: 'login' }, '', '/login');
        if (TAB_TITLES['login']) document.title = TAB_TITLES['login'];
      }
      return;
    }

    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const targetPath = tabId === 'home' ? '/' : `/${tabId}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: tabId }, '', targetPath);
      }
      if (TAB_TITLES[tabId]) {
        document.title = TAB_TITLES[tabId];
      }
    }
  }, [isAuthenticated]);

  // Route protection guard: Enforce authentication for all application routes
  useEffect(() => {
    if (loading) return;

    const currentTab = getTabFromLocation();

    if (!isAuthenticated) {
      // Unauthenticated: only 'login' and 'register' are permitted
      if (currentTab !== 'login' && currentTab !== 'register') {
        if (currentTab !== 'home') {
          redirectTabRef.current = currentTab;
        }
        setActiveTab('login');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.history.replaceState({ tab: 'login' }, '', '/login');
        }
        if (TAB_TITLES['login']) {
          document.title = TAB_TITLES['login'];
        }
      } else {
        setActiveTab(currentTab);
        if (typeof window !== 'undefined' && window.location.pathname !== `/${currentTab}`) {
          window.history.replaceState({ tab: currentTab }, '', `/${currentTab}`);
        }
        if (TAB_TITLES[currentTab]) {
          document.title = TAB_TITLES[currentTab];
        }
      }
    } else {
      // Authenticated: redirect away from login/register to target or home
      if (currentTab === 'login' || currentTab === 'register') {
        const dest = redirectTabRef.current || 'home';
        redirectTabRef.current = null;
        setActiveTab(dest);
        const targetPath = dest === 'home' ? '/' : `/${dest}`;
        if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
          window.history.replaceState({ tab: dest }, '', targetPath);
        }
        if (TAB_TITLES[dest]) {
          document.title = TAB_TITLES[dest];
        }
      } else {
        setActiveTab(currentTab);
        if (TAB_TITLES[currentTab]) {
          document.title = TAB_TITLES[currentTab];
        }
      }
    }
  }, [isAuthenticated, loading]);

  // Listen to browser navigation (back/forward and hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      if (loading) return;
      const currentTab = getTabFromLocation();

      // Enforce route protection on browser Back/Forward navigation
      if (!isAuthenticated && currentTab !== 'login' && currentTab !== 'register') {
        if (currentTab !== 'home') {
          redirectTabRef.current = currentTab;
        }
        setActiveTab('login');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.history.replaceState({ tab: 'login' }, '', '/login');
        }
        if (TAB_TITLES['login']) document.title = TAB_TITLES['login'];
        return;
      }

      setActiveTab(currentTab);
      if (TAB_TITLES[currentTab]) {
        document.title = TAB_TITLES[currentTab];
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [isAuthenticated, loading]);

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
    if (!isAuthenticated) return;
    setIsAnalyticsLoading(true);
    try {
      const data = await getAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.warn('Analytics fetch error:', err.message);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [isAuthenticated]);

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
    fetchModels();

    if (isAuthenticated) {
      fetchAnalytics();
    }

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

  // 1. Session verification loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <p className="text-xs text-slate-400 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Layout: Login as Default Entry Page (Protects all website pages)
  if (!isAuthenticated) {
    const isRegister = activeTab === 'register' || (typeof window !== 'undefined' && getTabFromLocation() === 'register');
    return (
      <AuthLayout>
        {isRegister ? (
          <RegisterPage
            onNavigateLogin={() => handleTabChange('login')}
            onRegisterSuccess={() => {
              const dest = redirectTabRef.current || 'home';
              redirectTabRef.current = null;
              handleTabChange(dest);
            }}
          />
        ) : (
          <LoginPage
            onNavigateRegister={() => handleTabChange('register')}
            onLoginSuccess={() => {
              const dest = redirectTabRef.current || 'home';
              redirectTabRef.current = null;
              handleTabChange(dest);
            }}
          />
        )}
      </AuthLayout>
    );
  }

  // 3. Authenticated Dashboard Layout (Navbar + Main Content + Footer)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        healthStatus={healthStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'home' && (
          <HomePage
            setActiveTab={handleTabChange}
            analyticsData={analyticsData}
            healthStatus={healthStatus}
          />
        )}

        {activeTab === 'assess' && (
          <AssessmentPage
            onPredictionSuccess={handlePredictionSuccess}
            modelsInfo={modelsInfo}
            onNavigateTab={handleTabChange}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            analyticsData={analyticsData}
            onRefresh={fetchAnalytics}
            isLoading={isAnalyticsLoading}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            onHistoryChange={fetchAnalytics}
          />
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
          <AboutPage onNavigateTab={handleTabChange} modelsInfo={modelsInfo} />
        )}
      </main>

      {/* Professional Dashboard Footer */}
      <Footer 
        onNavigate={handleTabChange} 
        healthStatus={healthStatus} 
        modelsInfo={modelsInfo} 
      />
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
