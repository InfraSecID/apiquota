import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Terminal, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'VIEWER'>('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({ email, password, role });
        onSuccess(res.user);
      } else {
        const res = await api.login({ email, password });
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoRole: 'ADMIN' | 'VIEWER') => {
    setIsRegister(false);
    if (demoRole === 'ADMIN') {
      setEmail('admin@apiquota.dev');
      setPassword('Password123!');
    } else {
      setEmail('viewer@apiquota.dev');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-[1px] mb-4 shadow-xl shadow-emerald-500/20">
            <div className="h-full w-full bg-[#0a0a0a] rounded-[15px] flex items-center justify-center">
              <Terminal className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">APIQuota</h1>
          <p className="text-sm text-neutral-400 mt-2">
            Enterprise API Quota Monitoring & AES-256-GCM Vault
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-neutral-800 rounded-2xl p-7 shadow-2xl">
          <div className="flex items-center justify-between pb-5 border-b border-neutral-800 mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isRegister ? 'Create Account' : 'Sign In'}
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              JWT Secured
            </span>
          </div>

          {error && (
            <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apiquota.dev"
                  required
                  className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition font-mono"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition ${
                      role === 'ADMIN'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'bg-[#0a0a0a] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    ADMIN (Full Access)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('VIEWER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition ${
                      role === 'VIEWER'
                        ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                        : 'bg-[#0a0a0a] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    VIEWER (Read Only)
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-neutral-400 hover:text-emerald-400 transition"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="mt-5 p-3 rounded-xl bg-[#0a0a0a] border border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-2 font-semibold">
              Demo Credentials (Click to prefill):
            </span>
            <div className="flex space-x-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="flex-1 py-1 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition text-center"
              >
                ADMIN Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('VIEWER')}
                className="flex-1 py-1 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition text-center"
              >
                VIEWER Demo
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-neutral-500 mt-6 font-mono">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>httpOnly cookie token storage. XSS safe.</span>
        </div>
      </div>
    </div>
  );
};
