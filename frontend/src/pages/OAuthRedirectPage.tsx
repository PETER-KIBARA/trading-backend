import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../services/api';

/**
 * OAuth Redirect Handler
 * This component handles the Deriv OAuth callback
 * URL: /oauth-redirect?token1=XXX&acct1=XXX&cur1=XXX&token2=...
 */
export const OAuthRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your Deriv OAuth login...');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Parse query parameters
        const params = new URLSearchParams(location.search);
        
        // Extract all tokens and accounts
        const accounts: Array<{ token: string; accountId: string; currency: string }> = [];
        let index = 1;
        
        // Deriv returns token1, acct1, cur1, token2, acct2, cur2, etc.
        while (params.has(`token${index}`)) {
          const token = params.get(`token${index}`);
          const accountId = params.get(`acct${index}`);
          const currency = params.get(`cur${index}`);

          if (token && accountId) {
            accounts.push({
              token,
              accountId,
              currency: currency || 'USD',
            });
          }
          index++;
        }

        if (accounts.length === 0) {
          throw new Error('No valid Deriv account tokens found in OAuth callback');
        }

        setMessage(`Found ${accounts.length} account(s). Connecting...`);

        // Send all accounts to backend
        const response = await apiClient.connectDerivOAuthAccounts(accounts);

        if (response.data.success) {
          setStatus('success');
          setMessage(`Successfully connected ${accounts.length} account(s)!`);
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          throw new Error(response.data.error || 'Failed to connect accounts');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to process OAuth login');
        console.error('OAuth error:', error);
      }
    };

    handleOAuthCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="app-bg" />
      <div className="relative z-10 surface-strong rounded-2xl p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader className="animate-spin mx-auto mb-4 text-cyan-300" size={40} />
            <h1 className="text-2xl font-semibold text-white mb-2">Connecting Account</h1>
            <p className="text-slate-300">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-emerald-300" size={40} />
            <h1 className="text-2xl font-semibold text-white mb-2">Success!</h1>
            <p className="text-slate-300 mb-4">{message}</p>
            <p className="text-sm text-slate-400">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="mx-auto mb-4 text-red-300" size={40} />
            <h1 className="text-2xl font-semibold text-white mb-2">Connection Failed</h1>
            <p className="text-red-200 mb-4">{message}</p>
            <button
              onClick={() => navigate('/connect-deriv')}
              className="btn-primary w-full"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthRedirectPage;
