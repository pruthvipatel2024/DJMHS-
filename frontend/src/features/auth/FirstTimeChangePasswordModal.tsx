import React, { useState } from 'react';
import { ShieldAlert, Check, Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from './AuthContext';

const FirstTimeChangePasswordModal: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
  const isStaffRole = userRole === 'ADMIN' || userRole === 'TEACHER';

  if (!user || !user.isFirstLogin || !isStaffRole) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match.');
    }
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters long, including uppercase, lowercase, numbers, and symbols.');
    }

    setLoading(true);
    try {
      await api.post('/auth/first-time-change-password', { newPassword });
      const updated = { ...user, isFirstLogin: false };
      updateUser(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update initial security password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-8 relative">
        
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Initial Password Reset Required</h3>
            <p className="text-xs text-slate-500 mt-0.5">Per DJMHS ERP Security Protocol (Chapter 1.9), default credentials must be replaced on first login.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              New Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong password..."
                className="w-full pl-10 p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter strong password..."
                className="w-full pl-10 p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-xs text-slate-600 border border-slate-200">
            <p className="font-semibold text-slate-800 mb-1">Password Complexity Rules:</p>
            <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> At least 8 characters in length</div>
            <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Contains uppercase and lowercase letters</div>
            <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Contains numbers and symbols (!@#$%)</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary-600/30 transition text-sm disabled:opacity-60"
          >
            {loading ? 'Securing Account...' : 'Confirm & Proceed to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstTimeChangePasswordModal;
