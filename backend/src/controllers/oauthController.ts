import crypto from 'node:crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { accountService } from '../services/accountService.js';
import { userService } from '../services/userService.js';
import { createError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { authService } from '../utils/auth.js';
import { ENV } from '../config/env.js';

interface ConnectedAccountResponse {
  id: string;
  accountId: string;
  accountName: string;
  currency: string;
  balance: number;
  connectionStatus: string;
}

async function resolveOAuthUserId(
  req: AuthRequest,
  firstAccountId: string,
): Promise<{ userId: string; isNewUser: boolean }> {
  if (req.userId) {
    return { userId: req.userId, isNewUser: false };
  }

  logger.info('[OAuth] No authenticated user - creating new user account', {
    accountId: firstAccountId,
  });

  const tempEmail = `oauth-${firstAccountId}-${Date.now()}@trading-platform.local`;
  const tempPassword = crypto.randomBytes(16).toString('hex');

  const newUser = await userService.registerUser(
    tempEmail,
    tempPassword,
    'Deriv User',
    firstAccountId,
  );

  logger.info('[OAuth] Created new OAuth user', { userId: newUser.id, email: tempEmail });
  return { userId: newUser.id, isNewUser: true };
}

async function finalizeOAuthConnection(
  req: AuthRequest,
  userId: string,
  isNewUser: boolean,
  connectedAccounts: Awaited<ReturnType<typeof accountService.addDerivAccount>>[],
  res: Response,
): Promise<void> {
  const defaultAccount = await accountService.getDefaultAccount(userId);
  if (!defaultAccount && connectedAccounts.length > 0) {
    await accountService.setDefaultAccount(connectedAccounts[0].id, userId);
    logger.info(`[OAuth] Set default account to ${connectedAccounts[0].id}`);
  }

  try {
    await Promise.all(
      connectedAccounts.map((acc) =>
        accountService.syncAccountBalance(acc.id).catch((err: Error) => {
          logger.warn(`[OAuth] Failed to sync balance for ${acc.id}:`, err.message);
          return null;
        }),
      ),
    );
  } catch (error) {
    logger.warn('[OAuth] Balance sync encountered errors', error);
  }

  let accessToken = req.token;
  if (isNewUser || !accessToken) {
    logger.info('[OAuth] Generating JWT token for OAuth user', { userId, isNewUser });
    const user = await userService.getUserById(userId);
    accessToken = authService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }

  const accounts: ConnectedAccountResponse[] = connectedAccounts.map((acc) => ({
    id: acc.id,
    accountId: acc.accountId,
    accountName: acc.accountName,
    currency: acc.currency,
    balance: acc.balance,
    connectionStatus: acc.connectionStatus,
  }));

  res.status(201).json({
    success: true,
    message: `Successfully connected ${connectedAccounts.length} account(s)`,
    accessToken,
    accounts,
  });
}

/**
 * Handle OAuth account connection
 * Can be called with or without JWT auth
 * If no JWT: creates a new user based on Deriv account
 * If JWT exists: adds accounts to existing user
 */
export const connectOAuthAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accounts } = req.body;

    logger.info('[OAuth] POST /accounts/oauth/connect', {
      accountCount: Array.isArray(accounts) ? accounts.length : 0,
      authenticatedUserId: req.userId ?? null,
    });

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw createError(400, 'At least one account is required');
    }

    for (const account of accounts) {
      if (!account.token || !account.accountId) {
        throw createError(400, 'Each account must have token and accountId');
      }
    }

    const { userId, isNewUser } = await resolveOAuthUserId(req, accounts[0].accountId);

    logger.info(`[OAuth] User ${userId} connecting ${accounts.length} legacy account(s)`, {
      accountIds: accounts.map((a: { accountId: string }) => a.accountId),
    });

    const connectedAccounts = await Promise.all(
      accounts.map((account: { accountId: string; token: string; currency?: string }) =>
        accountService.addDerivAccount(
          userId,
          account.accountId,
          `${account.accountId} (${account.currency || 'USD'})`,
          account.token,
          'real',
        ),
      ),
    );

    await finalizeOAuthConnection(req, userId, isNewUser, connectedAccounts, res);
  } catch (error: any) {
    logger.error('[OAuth] Connection failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * OAuth 2.0 PKCE callback — exchange authorization code for Deriv access token.
 */
export const exchangePkceOAuth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, codeVerifier, redirectUri } = req.body;

    logger.info('[OAuth] POST /accounts/oauth/pkce', {
      hasCode: Boolean(code),
      redirectUri,
      authenticatedUserId: req.userId ?? null,
    });

    if (!code || !codeVerifier || !redirectUri) {
      throw createError(400, 'code, codeVerifier, and redirectUri are required');
    }

    if (!ENV.DERIV.CLIENT_SECRET) {
      throw createError(
        500,
        'DERIV_CLIENT_SECRET is not configured on the server. Use legacy OAuth or add the secret in Render.',
      );
    }

    const tokenResponse = await fetch(ENV.DERIV.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ENV.DERIV.CLIENT_ID,
        client_secret: ENV.DERIV.CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || !tokenData.access_token) {
      logger.error('[OAuth PKCE] Token exchange failed', tokenData);
      throw createError(
        400,
        tokenData.error_description || tokenData.error || 'Deriv token exchange failed',
      );
    }

    const derivAccessToken = tokenData.access_token;
    const { userId, isNewUser } = await resolveOAuthUserId(req, 'pkce-user');

    const connectedAccount = await accountService.addDerivAccount(
      userId,
      'pending',
      'Deriv OAuth',
      derivAccessToken,
      'real',
    );

    await finalizeOAuthConnection(req, userId, isNewUser, [connectedAccount], res);
  } catch (error: any) {
    logger.error('[OAuth PKCE] Exchange failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Disconnect all OAuth accounts
 */
export const disconnectOAuthAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const accounts = await accountService.getUserAccounts(req.userId);

    // Delete all accounts
    await Promise.all(
      accounts.map((account) => accountService.deleteAccount(account.id, req.userId!))
    );

    logger.info(`[OAuth] User ${req.userId} disconnected all ${accounts.length} account(s)`);

    res.json({
      success: true,
      message: `Disconnected ${accounts.length} account(s)`,
    });
  } catch (error: any) {
    logger.error('[OAuth] Disconnect failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
