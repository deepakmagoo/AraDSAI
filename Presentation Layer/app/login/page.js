'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Zap, AlertCircle, ArrowRight, FlaskConical, ShieldCheck, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, fullName, organization);
        // After successful registration, switch to login mode
        setMode('login');
        setPassword('');
        setError('');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@compliance.ai');
    setPassword('demo123');
    setError('');
    setMode('login');
  };

  const fillAdmin = () => {
    setEmail('admin@compliance.ai');
    setPassword('admin123');
    setError('');
    setMode('login');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mb-5 shadow-2xl shadow-indigo-900/60">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RegCompCopilot</h1>
          <p className="text-indigo-300 text-sm mt-2">AI-Powered Regulatory Document Analysis</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {mode === 'login'
                  ? 'Access your regulatory compliance tools'
                  : 'Get started with RegCompCopilot'}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Your Company"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:from-indigo-800 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  {mode === 'login' ? (
                    <>
                      Sign in <ArrowRight size={15} />
                    </>
                  ) : (
                    <>
                      Create account <UserPlus size={15} />
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-5 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              {mode === 'login' ? (
                <>
                  Don't have an account? <span className="text-indigo-600">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="text-indigo-600">Sign in</span>
                </>
              )}
            </button>
          </div>

          {mode === 'login' && (
            <>
              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 bg-white px-3 w-fit mx-auto">
                  try a demo account
                </div>
              </div>

              {/* Demo accounts */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={fillDemo}
                  type="button"
                  className="flex flex-col items-center gap-1.5 py-3 px-3 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200 text-slate-700 text-sm rounded-xl transition-all group"
                >
                  <FlaskConical size={16} className="text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-700">Demo User</span>
                  <span className="text-[10px] text-slate-400">demo@compliance.ai</span>
                </button>
                <button
                  onClick={fillAdmin}
                  type="button"
                  className="flex flex-col items-center gap-1.5 py-3 px-3 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 text-slate-700 text-sm rounded-xl transition-all group"
                >
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">Admin</span>
                  <span className="text-[10px] text-slate-400">admin@compliance.ai</span>
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-300 mt-3">
                Demo password: <span className="font-mono font-semibold text-slate-400">demo123</span>
                &nbsp;·&nbsp;Admin password:{' '}
                <span className="font-mono font-semibold text-slate-400">admin123</span>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} RegCompCopilot · Powered by AWS Bedrock
        </p>
      </div>
    </div>
  );
}
