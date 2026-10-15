import React, { useState } from 'react';
import { 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FoodSafetyDisclaimer from '../components/FoodSafetyDisclaimer';

export default function RegisterPage({ onNavigateLogin, onRegisterSuccess, onContinueGuest }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeDisclaimer, setAgreeDisclaimer] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (name.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }
    if (!agreeDisclaimer) {
      setErrorMessage('Please acknowledge the food safety inspection notice to continue.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (err) {
      let detail = err.response?.data?.detail;
      if (!detail) {
        if (err.message === 'Network Error' || !err.response) {
          detail = 'Network Error: Cannot connect to the backend server. Please check your network connection and ensure the backend is running.';
        } else {
          detail = err.message || 'Registration failed. Please try again.';
        }
      }
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 shadow-inner text-2xl mb-1">
            🥗
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Join FoodQuality AI to track assessments and produce quality history
          </p>
        </div>

        {/* Registration Card */}
        <div className="p-5 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Confirm Password
                </label>
                {confirmPassword && (
                  <span className={`text-[10px] font-semibold ${isPasswordMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPasswordMatch ? '✓ Passwords match' : '✗ Mismatch'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                    confirmPassword && !isPasswordMatch
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Disclaimer & Terms Agreement */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeDisclaimer}
                  onChange={(e) => setAgreeDisclaimer(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="leading-snug">
                  I acknowledge that visual assessment is an assistive tool and cannot determine microbiological safety or edibility.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Free Account
                </>
              )}
            </button>
          </form>

          {/* Navigation to Login */}
          <div className="pt-4 border-t border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Sign in here
              </button>
            </p>

            {onContinueGuest && (
              <div>
                <button
                  type="button"
                  onClick={onContinueGuest}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Continue browsing as Guest &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Compact Safety Notice */}
        <FoodSafetyDisclaimer compact />
      </div>
    );
  }
