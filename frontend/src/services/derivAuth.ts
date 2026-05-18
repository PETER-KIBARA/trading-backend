export interface DerivOAuthAccount {
  accountId: string;
  token: string;
}

const ACCOUNTS_STORAGE_KEY = 'derivOAuthAccounts';
const ACTIVE_ACCOUNT_STORAGE_KEY = 'activeAccountId';

export const DERIV_APP_ID =
  import.meta.env.VITE_DERIV_APP_ID || '33eUdlaPLj4gee5BGCXvd';

export const DERIV_OAUTH_AUTHORIZE_URL = 'https://oauth.deriv.com/oauth2/authorize';

export function getOAuthRedirectUri(): string {
  return `${window.location.origin}/oauth-redirect`;
}

/** Builds the Deriv OAuth2 authorize URL per official redirect flow. */
export function buildDerivAuthorizeUrl(): string {
  const redirectUri = encodeURIComponent(getOAuthRedirectUri());
  return `${DERIV_OAUTH_AUTHORIZE_URL}?app_id=${encodeURIComponent(DERIV_APP_ID)}&redirect_uri=${redirectUri}`;
}

/** Parses `acct1` / `token1`, `acct2` / `token2`, … from the OAuth callback query string. */
export function parseDerivOAuthCallback(search: string): DerivOAuthAccount[] {
  const params = new URLSearchParams(search);
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
