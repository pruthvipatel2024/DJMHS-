import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, BookOpen, AlertCircle, Smartphone, KeyRound } from 'lucide-react';
import { useAuth } from './AuthContext';
import api from '../../services/api';
import ForgotPasswordModal from './ForgotPasswordModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import logo from '../../assets/logo.png';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Please enter your registered Email, Mobile, or ID.'),
  password: z.string().min(1, 'Password is required to sign in.'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loginMode, setLoginMode] = useState<'STAFF' | 'STUDENT'>('STAFF');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Student OTP state
  const [grNumber, setGrNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmitStaff = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await api.post('/auth/login', data);
      const { token, user } = response.data;
      login(token, user, data.rememberMe);

      if (user.role.name === 'ADMIN') navigate('/admin');
      else if (user.role.name === 'TEACHER') navigate('/teacher');
      else navigate('/portal');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Unable to sign in. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestStudentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grNumber.trim()) {
      setErrorMessage('Please enter your Student GR Number.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/auth/student/request-otp', { grNumber: grNumber.trim() });
      setOtpSent(true);
      setSuccessMessage(res.data.message);
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : err.message);
      setErrorMessage(serverMsg || 'Unable to dispatch OTP. Please check GR number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyStudentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorMessage('Please enter the 6-digit OTP received.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/auth/student/verify-otp', { grNumber: grNumber.trim(), otp: otp.trim() });
      const { token, user } = res.data;
      login(token, user, true);
      navigate('/portal');
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : err.message);
      setErrorMessage(serverMsg || 'Invalid or expired OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = (identifier: string) => {
    setLoginMode('STAFF');
    setValue('identifier', identifier, { shouldValidate: true });
    setValue('password', 'Password@123', { shouldValidate: true });
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(29,78,216,0.35),rgba(255,255,255,0))] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Left Branding Wing */}
        <div className="md:col-span-6 bg-gradient-to-br from-primary-800 via-primary-900 to-slate-950 p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent-500/20 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-primary-500/20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="mb-6 w-24 h-24 rounded-full bg-white p-1 shadow-2xl border-2 border-accent-400 overflow-hidden flex items-center justify-center flex-shrink-0">
              <img src={logo} alt="DJMHS School Crest" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-primary-700/80 border border-primary-500/40 text-accent-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-accent-400" />
              Bhavnagar, Gujarat — Est. 1959
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
              {t('school_name_full')}
            </h1>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              Institutional Enterprise Resource Planning System for Standards 9 to 12 Commerce.
            </p>
          </div>

          <div className="relative z-10 mt-12 pt-6 border-t border-primary-700/50 text-xs text-slate-400">
            <p>Institutional Access Portal — Protected by Role-Based Access Control & Encrypted OTP Verification.</p>
          </div>
        </div>

        {/* Right Form Wing */}
        <div className="md:col-span-6 p-8 lg:p-12 flex flex-col justify-center relative">
          <div className="absolute top-6 right-6">
            <LanguageSwitcher />
          </div>
          <div className="max-w-md mx-auto w-full">

            {/* Portal Tab Selection */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-8">
              <button
                type="button"
                onClick={() => { setLoginMode('STAFF'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition ${loginMode === 'STAFF' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Admin & Faculty
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('STUDENT'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition ${loginMode === 'STUDENT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Student / Parent OTP
              </button>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-sm rounded-r-xl flex items-start gap-3 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>{successMessage}</p>
              </div>
            )}

            {loginMode === 'STAFF' ? (
              <form onSubmit={handleSubmit(onSubmitStaff)} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t('identifier_label')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      {...register('identifier')}
                      placeholder="e.g., admin@sdjmt.edu.in"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.identifier.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      {t('password_label')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Authenticating...' : t('sign_in_button')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={otpSent ? handleVerifyStudentOtp : handleRequestStudentOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Student GR Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      disabled={otpSent}
                      value={grNumber}
                      onChange={(e) => setGrNumber(e.target.value)}
                      placeholder="e.g. DJMHS-GR-000001"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      6-Digit Verification OTP Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {!otpSent ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Requesting OTP...' : 'Request Login OTP'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Verifying OTP...' : 'Verify OTP & Sign In'}
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Change GR Number
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
};

export default LoginPage;
