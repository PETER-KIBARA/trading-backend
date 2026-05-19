export interface DerivOAuthAccount {
  accountId: string;
  token: string;
}

const ACCOUNTS_STORAGE_KEY = 'derivOAuthAccounts';
const ACTIVE_ACCOUNT_STORAGE_KEY = 'activeAccountId';
const PKCE_VERIFIER_KEY = 'deriv_oauth_code_verifier';
const PKCE_STATE_KEY = 'deriv_oauth_state';

export const DERIV_APP_ID =
  import.meta.env.VITE_DERIV_APP_ID || '33eUdlaPLj4gee5BGCXvd';

/** legacy = oauth.deriv.com (acct1/token1). pkce = auth.deriv.com (authorization code). */
export type DerivOAuthFlow = 'legacy' | 'pkce';

export const DERIV_OAUTH_FLOW: DerivOAuthFlow =
  import.meta.env.VITE_DERIV_OAUTH_FLOW === 'pkce' ? 'pkce' : 'legacy';

export const DERIV_LEGACY_AUTHORIZE_URL = 'https://oauth.deriv.com/oauth2/authorize';
export const DERIV_PKCE_AUTHORIZE_URL = 'https://auth.deriv.com/oauth2/auth';
export const DERIV_PKCE_TOKEN_URL = 'https://auth.deriv.com/oauth2/token';

export function getOAuthRedirectUri(): string {
  return `${window.location.origin}/oauth-redirect`;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return base64UrlEncode(digest);
}

/** Legacy Deriv OAuth: redirect URL is set in Deriv portal "Website URL" only — not in this URL. */
export function buildLegacyDerivAuthorizeUrl(): string {
  const params = new URLSearchParams({
    app_id: DERIV_APP_ID,
    l: 'EN',
  });
  return `${DERIV_LEGACY_AUTHORIZE_URL}?${params.toString()}`;
}

/** Modern Deriv OAuth 2.0 with PKCE (developers.deriv.com OAuth app). */
export async function buildPkceDerivAuthorizeUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(PKCE_STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: DERIV_APP_ID,
    redirect_uri: getOAuthRedirectUri(),
    scope: 'trade account_manage',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${DERIV_PKCE_AUTHORIZE_URL}?${params.toString()}`;
}

export function buildDerivAuthorizeUrl(): string | Promise<string> {
  if (DERIV_OAUTH_FLOW === 'pkce') {
    return buildPkceDerivAuthorizeUrl();
  }
  return buildLegacyDerivAuthorizeUrl();
}

export function getPkceSession(): { codeVerifier: string | null; state: string | null } {
  return {
    codeVerifier: sessionStorage.getItem(PKCE_VERIFIER_KEY),
    state: sessionStorage.getItem(PKCE_STATE_KEY),
  };
}

export function clearPkceSession(): void {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_STATE_KEY);
}

export function isLegacyOAuthCallback(search: string, hash: string): boolean {
  const params = mergeOAuthCallbackParams(search, hash);
  return params.has('token1') && params.has('acct1');
}

export function isPkceOAuthCallback(search: string, hash: string): boolean {
  const params = mergeOAuthCallbackParams(search, hash);
  return params.has('code');
}

/** Merges query-string and hash-fragment OAuth params (Deriv may use either). */
export function mergeOAuthCallbackParams(search: string, hash: string): URLSearchParams {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );

  const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
  if (rawHash) {
    const hashParams = new URLSearchParams(rawHash);
    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  return params;
}

/** Parses `acct1` / `token1`, `acct2` / `token2`, … from the OAuth callback URL. */
export function parseDerivOAuthCallback(search: string, hash = ''): DerivOAuthAccount[] {
  const params = mergeOAuthCallbackParams(search, hash);
  const accounts: DerivOAuthAccount[] = [];
  let index = 1;

  while (params.has(`acct${index}`) || params.has(`token${index}`)) {
    const accountId = params.get(`acct${index}`);
    const token = params.get(`token${index}`);

    if (accountId && token) {
      accounts.push({ accountId, token });
    }
    index += 1;
  }

  return accounts;
}

export function getOAuthCallbackError(search: string, hash = ''): string | null {
  const params = mergeOAuthCallbackParams(search, hash);
  return params.get('error') || params.get('error_description');
}

/**
 * If Deriv redirects to the site root (or any path) with tokens, forward to /oauth-redirect.
 */
export function shouldForwardToOAuthRedirect(pathname: string, search: string, hash: string): boolean {
  if (pathname.startsWith('/oauth-redirect')) return false;
  return isLegacyOAuthCallback(search, hash) || isPkceOAuthCallback(search, hash);
}

export function forwardToOAuthRedirect(): void {
  const { search, hash } = window.location;
  window.location.replace(`/oauth-redirect${search}${hash}`);
}

export function saveDerivOAuthAccounts(accounts: DerivOAuthAccount[]): void {
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));

  if (accounts.length > 0) {
    localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, accounts[0].accountId);
  } else {
    localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
  }
}

export function getDerivOAuthAccounts(): DerivOAuthAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is DerivOAuthAccount =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as DerivOAuthAccount).accountId === 'string' &&
        typeof (item as DerivOAuthAccount).token === 'string',
    );
  } catch {
    return [];
  }
}

export function getActiveDerivAccountId(): string | null {
  return localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}

export function getActiveDerivAccount(): DerivOAuthAccount | null {
  const accounts = getDerivOAuthAccounts();
  if (accounts.length === 0) return null;

  const activeId = getActiveDerivAccountId();
  if (activeId) {
    const match = accounts.find((account) => account.accountId === activeId);
    if (match) return match;
  }

  return accounts[0];
}

export function hasDerivConnection(): boolean {
  return getDerivOAuthAccounts().length > 0;
}

export function clearDerivOAuthAccounts(): void {
  localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
  localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}
