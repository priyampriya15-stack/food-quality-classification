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
            <p className="text-[11px] text-slate-400 hidden sm:block">Automated Visual Quality Assessment</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.requiresAuth)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Health Badge & Auth Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {/* System Health Badge */}
          {healthStatus ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
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
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 animate-spin text-slate-500" />
              Checking...
            </div>
          )}

          {/* Auth State Controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs transition-colors cursor-pointer group"
                title="View Account Profile & Settings"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold group-hover:bg-emerald-500/30">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-white font-medium truncate max-w-[110px]" title={user?.email}>
                  {user?.name || user?.email}
                </span>
                <Settings className="w-3 h-3 text-slate-500 group-hover:text-slate-300 ml-0.5" />
              </button>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'login'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                  activeTab === 'register'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.requiresAuth)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800/80 mt-2 space-y-1">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setIsProfileOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-white font-medium truncate">{user?.name}</span>
                    <span className="text-[10px] text-slate-500 truncate">({user?.email})</span>
                  </div>
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setActiveTab('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Register
                </button>
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
