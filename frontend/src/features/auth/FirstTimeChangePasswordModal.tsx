import React, { useState, useMemo } from 'react';
import { ShieldAlert, Check, Lock, Eye, EyeOff, CheckCircle2, KeyRound, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from './AuthContext';

const FirstTimeChangePasswordModal: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const userRole = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
  const isStaffRole = userRole === 'ADMIN' || userRole === 'TEACHER';

  // Real-time validation checks
  const checks = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      match: newPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const allValid = checks.length && checks.upper && checks.lower && checks.number && checks.symbol && checks.match;

  if (!user || !user.isFirstLogin || !isStaffRole) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match. Please re-enter.');
    }
    if (!checks.length || !checks.upper || !checks.lower || !checks.number || !checks.symbol) {
      return setError('Please satisfy all password complexity requirements below.');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/first-time-change-password', { newPassword });
      setSuccess(true);
      setTimeout(() => {
        const updated = res.data?.user || { ...user, isFirstLogin: false };
        updateUser(updated);
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update initial security password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-7 sm:p-8 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700"></div>

        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <ShieldAlert className="w-3 h-3 text-amber-600" /> First-Time Faculty Sign-In
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Establish Your Personal Password</h3>
            <p className="text-xs text-slate-500">Welcome to DJMHS! You have authenticated with the temporary password from your email. Please create your personal password to finish sign-up.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 flex-shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-3 shadow-xs animate-in zoom-in-95">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="block font-black text-emerald-950">Password Successfully Established!</span>
              <span className="font-semibold text-emerald-800">Unlocking your institutional faculty dashboard...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              New Personal Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong password..."
                className="w-full pl-10 pr-10 p-3 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your chosen password..."
                className="w-full pl-10 pr-10 p-3 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Real-time Checklist */}
          <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5 text-xs text-slate-600 border border-slate-200">
            <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider mb-2">Password Requirements Checklist:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-semibold">
              <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.length ? 'text-emerald-600' : 'text-slate-300'}`} /> At least 8 characters
              </div>
              <div className={`flex items-center gap-1.5 ${checks.upper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.upper ? 'text-emerald-600' : 'text-slate-300'}`} /> Uppercase letter (A-Z)
              </div>
              <div className={`flex items-center gap-1.5 ${checks.lower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.lower ? 'text-emerald-600' : 'text-slate-300'}`} /> Lowercase letter (a-z)
              </div>
              <div className={`flex items-center gap-1.5 ${checks.number ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.number ? 'text-emerald-600' : 'text-slate-300'}`} /> Number (0-9)
              </div>
              <div className={`flex items-center gap-1.5 ${checks.symbol ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.symbol ? 'text-emerald-600' : 'text-slate-300'}`} /> Special symbol (!@#$%)
              </div>
              <div className={`flex items-center gap-1.5 ${checks.match ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.match ? 'text-emerald-600' : 'text-slate-300'}`} /> Passwords match
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success || !allValid}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-primary-600/30 transition text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              'Securing Account...'
            ) : success ? (
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> Password Confirmed</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Complete Sign-Up & Proceed to Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstTimeChangePasswordModal;
