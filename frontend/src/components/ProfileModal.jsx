import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  Edit3, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Database, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose, onLogout }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSaveName = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErrorMessage('Name must be at least 2 characters long.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ name: trimmed });
      setSuccessMessage('Display name updated successfully.');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update name.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Session';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">User Account Profile</h2>
              <p className="text-xs text-slate-400">Account identity and authorization details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-400 shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white truncate">{user.name}</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 uppercase tracking-wider">
                {user.role || 'Evaluator'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Account Metadata Details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-slate-500 text-[11px] block flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Database Account ID
            </span>
            <span className="text-slate-200 font-mono font-medium mt-1 block">
              User #{user.id}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-slate-500 text-[11px] block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Member Since
            </span>
            <span className="text-slate-200 font-medium mt-1 block">
              {formattedDate}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-slate-500 text-[11px] block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Account Status
            </span>
            <span className="text-emerald-400 font-semibold mt-1 block">
              Active &amp; Authenticated
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-slate-500 text-[11px] block flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Authentication Method
            </span>
            <span className="text-slate-200 font-medium mt-1 block">
              JWT Bearer (HS256)
            </span>
          </div>
        </div>

        {/* Display Name Edit Form */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              Profile Display Name
            </span>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Change Name
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveName} className="space-y-3 pt-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter new display name"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setName(user.name || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-slate-400 font-medium">
              Currently displayed as: <strong className="text-white">{user.name}</strong>
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500">
            Predictions &amp; analytics strictly isolated to your account ID.
          </p>
          <button
            onClick={() => {
              handleClose();
              if (onLogout) onLogout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
