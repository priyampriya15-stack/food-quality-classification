import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  BarChart3, 
  Clock, 
  Cpu, 
  Info, 
  Menu, 
  X, 
  UploadCloud, 
  LogIn, 
  UserPlus, 
  LogOut, 
  User,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';

export default function Navbar({ activeTab, setActiveTab, healthStatus }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Suppress navbar completely on authentication pages
  const isAuth = activeTab === 'login' || activeTab === 'register' || activeTab === 'signin' || activeTab === 'signup';
  const isAuthLocation = typeof window !== 'undefined' && (() => {
    const cleanPath = window.location.pathname.toLowerCase().replace(/^\/+/, '').replace(/\/+$/, '');
    const cleanHash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/+$/, '');
    return ['login', 'signin', 'register', 'signup'].includes(cleanPath) || ['login', 'signin', 'register', 'signup'].includes(cleanHash);
  })();

  if (isAuth || isAuthLocation) {
    return null;
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: ShieldCheck },
    { id: 'assess', label: 'Assessment', icon: UploadCloud, requiresAuth: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, requiresAuth: true },
    { id: 'history', label: 'History', icon: Clock, requiresAuth: true },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleNavClick = (tabId, requiresAuth) => {
    if (requiresAuth && !isAuthenticated) {
      setActiveTab('login');
    } else {
      setActiveTab(tabId);
    }
    setMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setActiveTab('home');
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
            🥗
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                FoodQuality AI
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">
                DL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xl:block">Automated Visual Quality Assessment</p>
          </div>
        </div>

        {/* Desktop Navigation: Visible on Large screens (1024px+) */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.requiresAuth)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Health Badge & Auth Controls (Responsive for Tablet & Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* System Health Badge: Hidden on very small mobile, visible on sm, tablet, & desktop */}
          {healthStatus ? (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span 
                className={`w-2 h-2 rounded-full ${
                  healthStatus.database_connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {healthStatus.model_ready ? 'Model Ready' : 'API Online'}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 animate-spin text-slate-500" />
              Checking...
            </div>
          )}

          {/* Auth State Controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2 sm:pl-2 sm:border-l sm:border-slate-800">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs transition-colors cursor-pointer group"
                title="View Account Profile & Settings"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold group-hover:bg-emerald-500/30">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-white font-medium truncate max-w-[80px] sm:max-w-[110px]" title={user?.email}>
                  {user?.name || user?.email}
                </span>
                <Settings className="w-3 h-3 text-slate-500 group-hover:text-slate-300 ml-0.5" />
              </button>
              <button
                onClick={handleLogoutClick}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              {activeTab !== 'login' && activeTab !== 'signin' && (
                <button
                  onClick={() => setActiveTab('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}
              {activeTab !== 'register' && activeTab !== 'signup' && (
                <button
                  onClick={() => setActiveTab('register')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register
                </button>
              )}
            </div>
          )}

          {/* Tablet & Mobile Menu Toggle (< 1024px) */}
          <div className="flex lg:hidden ml-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Tablet & Mobile Dropdown Drawer (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-1.5 shadow-2xl">
          {/* Mobile Health Status (shown on small screens where top-bar badge was hidden) */}
          <div className="sm:hidden px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">System Status</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus?.database_connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-white font-medium">
                {healthStatus?.model_ready ? 'Model Ready' : healthStatus?.status || 'Connecting'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.requiresAuth)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Drawer Auth & Profile Section */}
          <div className="pt-3 border-t border-slate-800/80 mt-2 space-y-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsProfileOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-300 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left truncate">
                      <p className="text-white font-semibold truncate">{user?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Settings className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Account
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                {activeTab !== 'login' && activeTab !== 'signin' && (
                  <button
                    onClick={() => {
                      setActiveTab('login');
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors text-center"
                  >
                    Sign In
                  </button>
                )}
                {activeTab !== 'register' && activeTab !== 'signup' && (
                  <button
                    onClick={() => {
                      setActiveTab('register');
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm text-center"
                  >
                    Register
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile & Account Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={handleLogoutClick}
      />
    </header>
  );
}
