import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../services/api';
import {
  parseDerivOAuthCallback,
  saveDerivOAuthAccounts,
  type DerivOAuthAccount,
} from '../services/derivAuth';

type RedirectStatus = 'processing' | 'success' | 'error';

interface ApiErrorShape {
  response?: {
    data?: {
      error?: string;
    };
  };
}

function isApiError(error: unknown): error is ApiErrorShape {
  return typeof error === 'object' && error !== null && 'response' in error;
}

async function syncAccountsWithBackend(
  search: string,
  accounts: DerivOAuthAccount[],
): Promise<void> {
  const params = new URLSearchParams(search);
  const payload = accounts.map((account, index) => {
    const position = index + 1;
    return {
      token: account.token,
      accountId: account.accountId,
      currency: params.get(`cur${position}`) || 'USD',
    };
  });

  try {
    const response = await apiClient.connectDerivOAuthAccounts(payload);

    if (response.data.accessToken) {
      apiClient.setToken(response.data.accessToken);
    }
  } catch (error) {
    // Local OAuth tokens are already stored; backend sync is best-effort when logged in.
    console.warn('Backend OAuth sync skipped or failed:', error);
  }
}

/**
 * OAuth Redirect Handler
 * Parses Deriv callback query params (acct1/token1, acct2/token2, …),
 * persists accounts in localStorage, optionally syncs with the backend.
 */
export const OAuthRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHandledCallback = useRef(false);

  const [status, setStatus] = useState<RedirectStatus>('processing');
  const [message, setMessage] = useState('Processing your Deriv OAuth login...');

  useEffect(() => {
    if (hasHandledCallback.current) return;
    hasHandledCallback.current = true;

    const handleOAuthCallback = async () => {
      try {
        const accounts = parseDerivOAuthCallback(location.search);

        if (accounts.length === 0) {
          throw new Error('No valid Deriv account tokens found in OAuth callback');
        }

        saveDerivOAuthAccounts(accounts);
        setMessage(`Connected ${accounts.length} account(s). Finalizing...`);

        await syncAccountsWithBackend(location.search, accounts);

        setStatus('success');
        setMessage(`Successfully connected ${accounts.length} account(s)!`);

        navigate('/', { replace: true });
      } catch (error: unknown) {
        setStatus('error');

        if (isApiError(error)) {
          setMessage(error.response?.data?.error || 'Failed to process OAuth login');
        } else if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage('Failed to process OAuth login');
        }

        console.error('OAuth error:', error);
      }
    };

    void handleOAuthCallback();
  }, [location.search, navigate]);

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
              type="button"
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