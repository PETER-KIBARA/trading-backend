import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await register(email, password, firstName, lastName);
      if (result.success) {
        setSuccess('Account created. You can sign in now.');
        setTimeout(() => navigate('/login'), 1000);
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
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-strong p-8 lg:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            <Sparkles size={14} /> Get started
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Create your trading workspace.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Set up your account and unlock a cleaner dashboard for bots, analytics, and risk management.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Set up your profile in minutes',
              'Track strategies and performance clearly',
              'Use the same interface on desktop and mobile',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <CheckCircle2 size={16} className="text-cyan-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-strong flex items-center p-6 sm:p-8">
          <div className="w-full">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Register</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Create account</h2>
              <p className="mt-2 text-sm text-slate-400">Start with a polished dashboard and instant trading visibility.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
              {success && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">First name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field" placeholder="John" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Last name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field" placeholder="Doe" required />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" required />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <span>Already have an account?</span>
              <Link to="/login" className="font-semibold text-white transition hover:text-cyan-300">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;