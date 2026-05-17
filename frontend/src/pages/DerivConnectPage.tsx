import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Link2, Loader } from 'lucide-react';
import { apiClient } from '../services/api';

export const DerivConnectPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get('token');
    if (callbackToken) {
      setToken(callbackToken);
      setAccountName(params.get('account_name') || 'My Deriv Account');
    }
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your Deriv API token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.connectDerivAccount(token, accountName || 'My Deriv Account');
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect Deriv account');
    } finally {
      setLoading(false);
    }
  };

  const handleGetTokenClick = () => {
    // Open Deriv OAuth flow
    window.open(
      'https://oauth.deriv.com/oauth2/authorize?app_id=1&scope=read%20trade',
      'Deriv Connect',
      'width=500,height=600'
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="app-bg" />
      <div className="mx-auto max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <section className="surface-strong p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
                <Link2 size={24} />
              </div>
              <h1 className="text-3xl font-semibold text-white">Connect Deriv Account</h1>
            </div>
            <p className="text-slate-300">
              Link your Deriv account to start automating trades and monitoring your portfolio.
            </p>
          </section>

          {/* Main Form */}
          <section className="surface p-6 sm:p-8">
            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-emerald-300 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-emerald-200">Success!</h3>
                  <p className="text-sm text-emerald-100 mt-1">Your Deriv account has been connected.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                <AlertCircle className="mt-0.5 text-red-300 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-red-200">Error</h3>
                  <p className="text-sm text-red-100 mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  API Token
                </label>
                <div className="space-y-3">
                  <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="input-field font-mono text-xs h-24 resize-none"
                    placeholder="Paste your Deriv API token here"
                    required
                  />
                  <p className="text-xs text-slate-400">
                    Don't have a token? Get one from{' '}
                    <button
                      type="button"
                      onClick={handleGetTokenClick}
                      className="text-cyan-300 hover:text-cyan-200 font-semibold transition"
                    >
                      Deriv OAuth
                    </button>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Account Label (Optional)
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., My Trading Account"
                />
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading && <Loader size={16} className="animate-spin" />}
                {success ? 'Connected! Redirecting...' : 'Connect Account'}
              </button>

              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">How to get your token:</h3>
                <ol className="text-sm text-slate-300 space-y-2">
                  <li>1. Visit <a href="https://app.deriv.com" target="_blank" rel="noopener noreferrer" className="text-cyan-300">app.deriv.com</a></li>
                  <li>2. Go to Settings → API Tokens</li>
                  <li>3. Create a new token with 'Trade' scope</li>
                  <li>4. Copy and paste the token here</li>
                </ol>
              </div>
            </form>
          </section>

          {/* Security Note */}
          <section className="surface border border-cyan-500/20 bg-cyan-500/10 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-cyan-500/20 p-2">
                <AlertCircle className="text-cyan-300" size={16} />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-cyan-100">Your token is encrypted</p>
                <p className="text-cyan-200/70 mt-1">
                  We never store your token in plain text. It's encrypted server-side and used only to execute authorized trades.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DerivConnectPage;
