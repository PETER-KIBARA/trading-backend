import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const highlights = [
  'Real-time trade monitoring',
  'Strategy and risk controls',
  'Clean analytics at a glance',
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="app-bg" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-strong relative overflow-hidden p-8 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_30%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                <Sparkles size={14} /> TradeAI
              </div>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                A modern control room for your trading stack.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Monitor balances, bots, trades, risk, and analytics from a polished workspace designed for clarity and speed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Live trades', value: '24/7', icon: TrendingUp },
                { label: 'Risk visibility', value: 'Instant', icon: Shield },
                { label: 'Dashboard', value: 'Refreshed', icon: Sparkles },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <Icon className="text-violet-300" size={18} />
                  <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                  <p className="text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                  <CheckCircle2 size={16} className="text-cyan-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-strong flex items-center p-6 sm:p-8">
          <div className="w-full">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Sign in</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-400">Access your dashboard and keep your trading system in sync.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <span>Need an account?</span>
              <Link to="/register" className="font-semibold text-white transition hover:text-cyan-300">
                Create one
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;