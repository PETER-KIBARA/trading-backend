import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Link2, Loader } from 'lucide-react';

const DERIV_APP_ID = import.meta.env.VITE_DERIV_APP_ID || '1';
const DERIV_OAUTH_URL = 'https://oauth.deriv.com/oauth2/authorize';
const REDIRECT_URI = `${window.location.origin}/oauth-redirect`;

/**
 * Deriv OAuth Connect Page
 * Modern OAuth 2.0 authentication flow
 */
export const DerivConnectPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleOAuthConnect = () => {
    setLoading(true);
    
    // Build OAuth URL with required parameters
    const oauthParams = new URLSearchParams({
      app_id: DERIV_APP_ID,
      scope: 'trade', // Request trade scope
      redirect_uri: REDIRECT_URI,
      response_type: 'token',
    });

    const oauthUrl = `${DERIV_OAUTH_URL}?${oauthParams.toString()}`;
    
    // Redirect to Deriv OAuth
    window.location.href = oauthUrl;
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
              Securely authorize your Deriv account with one click. Your tokens are encrypted server-side.
            </p>
          </section>

          {/* OAuth Button */}
          <section className="surface p-6 sm:p-8">
            <div className="space-y-6">
              {/* Main CTA */}
              <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/5 p-8 text-center">
                <h2 className="text-2xl font-semibold text-white mb-3">Ready to get started?</h2>
                <p className="text-slate-300 mb-6">
                  Click below to authorize with Deriv. You'll be redirected to their secure login page.
                </p>
                <button
                  onClick={handleOAuthConnect}
                  disabled={loading}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                      </svg>
                      Connect with Deriv OAuth
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

              {/* What happens next */}
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    number: '1',
                    title: 'Redirect to Deriv',
                    description: 'You\'ll be securely redirected to Deriv\'s official OAuth login',
                  },
                  {
                    number: '2',
                    title: 'Authorize',
                    description: 'Log in with your Deriv credentials and approve the connection',
                  },
                  {
                    number: '3',
                    title: 'Auto-Connect',
                    description: 'Your account(s) will automatically be linked and synced',
                  },
                ].map((step) => (
                  <div key={step.number} className="surface p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold flex items-center justify-center mx-auto mb-3">
                      {step.number}
                    </div>
                    <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-400">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits & Security */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Benefits */}
            <section className="surface p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                ✨ Why OAuth?
              </h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-cyan-300 mt-1">✓</span>
                  <span>More secure than copying/pasting tokens</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-300 mt-1">✓</span>
                  <span>Easily connect multiple accounts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-300 mt-1">✓</span>
                  <span>Automatic account discovery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-300 mt-1">✓</span>
                  <span>Tokens encrypted server-side</span>
                </li>
              </ul>
            </section>

            {/* Security Note */}
            <section className="surface border border-cyan-500/20 bg-cyan-500/10 p-6">
              <h3 className="text-lg font-semibold text-cyan-100 mb-4 flex items-center gap-2">
                🔒 Your Privacy
              </h3>
              <ul className="space-y-3 text-sm text-cyan-200/80">
                <li className="flex items-start gap-3">
                  <span className="text-cyan-300 mt-1">•</span>
                  <span>We never see your password</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-300 mt-1">•</span>
                  <span>OAuth tokens only for trading</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-300 mt-1">•</span>
                  <span>AES-256 encryption at rest</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-300 mt-1">•</span>
                  <span>You can revoke access anytime</span>
                </li>
              </ul>
            </section>
          </div>

          {/* FAQ */}
          <section className="surface p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Questions?</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-slate-200 mb-1">Is this secure?</h4>
                <p className="text-slate-400">
                  Yes. We use Deriv's official OAuth 2.0 flow. Your credentials are never shared with us.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 mb-1">Can I connect multiple accounts?</h4>
                <p className="text-slate-400">
                  Yes. If you have multiple Deriv accounts, they'll all be connected in one step.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 mb-1">What if I want to use manual tokens?</h4>
                <p className="text-slate-400">
                  OAuth is our recommended method. Contact support if you need manual token options.
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
