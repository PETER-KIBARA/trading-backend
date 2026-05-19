import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuthStore, useAccountStore } from '../context/store';
import {
  clearPkceSession,
  getOAuthCallbackError,
  getOAuthRedirectUri,
  getPkceSession,
  isLegacyOAuthCallback,
  isPkceOAuthCallback,
  mergeOAuthCallbackParams,
  parseDerivOAuthCallback,
  saveDerivOAuthAccounts,
  type DerivOAuthAccount,
} from '../services/derivAuth';
import { DerivAccount } from '../types';

type RedirectStatus = 'processing' | 'success' | 'error';

interface OAuthConnectResponse {
  success: boolean;
  accessToken?: string;
  error?: string;
  accounts?: Array<{
    id: string;
    accountId: string;
    accountName: string;
    currency: string;
    balance?: number;
    connectionStatus?: string;
  }>;
}

interface ApiErrorShape {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

function isApiError(error: unknown): error is ApiErrorShape {
  return typeof error === 'object' && error !== null && 'response' in error;
}

function mapOAuthAccountsToStore(
  accounts: OAuthConnectResponse['accounts'],
): DerivAccount[] {
  if (!accounts?.length) return [];

  return accounts.map((account, index) => ({
    id: account.id,
    accountId: account.accountId,
    accountName: account.accountName,
    accountType: 'real' as const,
    balance: account.balance ?? 0,
    currency: account.currency || 'USD',
    isDefault: index === 0,
    connectionStatus: (account.connectionStatus as DerivAccount['connectionStatus']) || 'connected',
    createdAt: new Date().toISOString(),
  }));
}

async function syncLegacyAccountsWithBackend(
  search: string,
  hash: string,
  accounts: DerivOAuthAccount[],
): Promise<OAuthConnectResponse> {
  const params = mergeOAuthCallbackParams(search, hash);
  const payload = accounts.map((account, index) => ({
    token: account.token,
    accountId: account.accountId,
    currency: params.get(`cur${index + 1}`) || 'USD',
  }));

  const response = await apiClient.connectDerivOAuthAccounts(payload);
  const data = response.data as OAuthConnectResponse;

  if (!data.success) {
    throw new Error(data.error || 'Failed to connect accounts on server');
  }

  return data;
}

async function syncPkceWithBackend(
  search: string,
  hash: string,
): Promise<OAuthConnectResponse> {
  const params = mergeOAuthCallbackParams(search, hash);
  const code = params.get('code');
  const returnedState = params.get('state');

  if (!code) {
    throw new Error('No authorization code received from Deriv');
  }

  const { codeVerifier, state: savedState } = getPkceSession();

  if (!codeVerifier) {
    throw new Error('OAuth session expired. Please start the connection again.');
  }

  if (returnedState && savedState && returnedState !== savedState) {
    throw new Error('OAuth state mismatch. Please try connecting again.');
  }

  const response = await apiClient.exchangeDerivPkceCode({
    code,
    codeVerifier,
    redirectUri: getOAuthRedirectUri(),
    state: returnedState || savedState || '',
  });

  clearPkceSession();

  const data = response.data as OAuthConnectResponse;
  if (!data.success) {
    throw new Error(data.error || 'Failed to complete OAuth login');
  }

  return data;
}

async function establishAuthSession(): Promise<void> {
  const { setUser, setAuthenticated, setLoading } = useAuthStore.getState();
  const response = await apiClient.getProfile();
  setUser(response.data.user);
  setAuthenticated(true);
  setLoading(false);
}

function applySessionFromSync(syncResult: OAuthConnectResponse): void {
  if (syncResult.accessToken) {
    apiClient.setToken(syncResult.accessToken);
  } else if (!localStorage.getItem('accessToken')) {
    throw new Error('Server did not return a session token. Please try again.');
  }

  const storeAccounts = mapOAuthAccountsToStore(syncResult.accounts);
  if (storeAccounts.length > 0) {
    useAccountStore.getState().setAccounts(storeAccounts);
    useAccountStore.getState().setSelectedAccount(storeAccounts[0]);
  }
}

export const OAuthRedirectPage: React.FC = () => {
  const location = useLocation();
  const hasHandledCallback = useRef(false);

  const [status, setStatus] = useState<RedirectStatus>('processing');
  const [message, setMessage] = useState('Processing your Deriv OAuth login...');

  useEffect(() => {
    if (hasHandledCallback.current) return;
    hasHandledCallback.current = true;

    const handleOAuthCallback = async () => {
      try {
        const oauthError = getOAuthCallbackError(location.search, location.hash);
        if (oauthError) {
          throw new Error(oauthError);
        }

        const isLegacy = isLegacyOAuthCallback(location.search, location.hash);
        const isPkce = isPkceOAuthCallback(location.search, location.hash);

        if (!isLegacy && !isPkce) {
          throw new Error(
            'No Deriv OAuth data in this URL. Confirm your Deriv app Website URL is exactly ' +
              getOAuthRedirectUri(),
          );
        }

        let syncResult: OAuthConnectResponse;

        if (isLegacy) {
          const accounts = parseDerivOAuthCallback(location.search, location.hash);
          if (accounts.length === 0) {
            throw new Error('No valid Deriv account tokens found in OAuth callback');
          }

          saveDerivOAuthAccounts(accounts);
          setMessage(`Found ${accounts.length} account(s). Connecting to TradeAI...`);
          syncResult = await syncLegacyAccountsWithBackend(location.search, location.hash, accounts);
        } else {
          setMessage('Exchanging authorization code with TradeAI...');
          syncResult = await syncPkceWithBackend(location.search, location.hash);
        }

        applySessionFromSync(syncResult);
        await establishAuthSession();

        setStatus('success');
        setMessage('Successfully connected your Deriv account!');

        window.setTimeout(() => {
          window.location.replace('/');
        }, 800);
      } catch (error: unknown) {
        setStatus('error');

        if (isApiError(error)) {
          setMessage(
            error.response?.data?.error ||
              error.message ||
              'Failed to sync Deriv accounts with the server',
          );
        } else if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage('Failed to process OAuth login');
        }

        console.error('OAuth error:', error);
      }
    };

    void handleOAuthCallback();
  }, [location.search, location.hash]);

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
              onClick={() => {
                window.location.href = '/connect-deriv';
              }}
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
