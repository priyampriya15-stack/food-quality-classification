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

  // Sync display name whenever user data changes or modal opens
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    // Always start in view mode when modal opens
    setIsEditing(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleStartEdit = () => {
    setName(user?.name || '');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user?.name || '');
    setErrorMessage(null);
    setIsEditing(false);
  };

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
      setSuccessMessage('Profile name updated successfully.');
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
    handleCancelEdit();
    onClose();
  };

  const handleSignOutClick = () => {
    // Dismiss edit mode and unsaved state immediately
    handleCancelEdit();
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Session';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-dialog-title"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-7 space-y-5 sm:space-y-6 text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="profile-dialog-title" className="text-lg font-bold text-white tracking-tight">
                User Account Profile
              </h2>
              <p className="text-xs text-slate-400">Account identity and authorization details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Notifications */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* User Identity Banner */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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

        {/* Dedicated Profile Editing Section */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
          {!isEditing ? (
            /* View Mode: Displays profile details with separate Edit Profile button */
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Profile Display Name
                </span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {user.name || 'Not provided'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          ) : (
            /* Edit Mode: Shows input field, Save Changes, and Cancel buttons ONLY */
            <form onSubmit={handleSaveName} className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Display Name
                </span>
              </div>
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
                  onClick={handleCancelEdit}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
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
          )}
        </div>

        {/* Modal Footer: Separate Sign Out action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            Predictions &amp; analytics strictly isolated to your account ID.
          </p>
          <button
            type="button"
            onClick={handleSignOutClick}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
