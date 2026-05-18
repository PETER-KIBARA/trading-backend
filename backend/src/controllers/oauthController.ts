import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { accountService } from '../services/accountService.js';
import { userService } from '../services/userService.js';
import { createError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { authService } from '../utils/auth.js';

/**
 * Handle OAuth account connection
 * Can be called with or without JWT auth
 * If no JWT: creates a new user based on Deriv account
 * If JWT exists: adds accounts to existing user
 */
export const connectOAuthAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accounts } = req.body;

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw createError(400, 'At least one account is required');
    }

    // Validate each account
    for (const account of accounts) {
      if (!account.token || !account.accountId) {
        throw createError(400, 'Each account must have token and accountId');
      }
    }

    let userId = req.userId;
    let isNewUser = false;

    // If no user is authenticated, create a new user for OAuth
    if (!userId) {
      logger.info('[OAuth] No authenticated user - creating new user account', {
        accountIds: accounts.map((a) => a.accountId),
      });

      try {
        // Generate unique email based on first account ID
        const tempEmail = `oauth-${accounts[0].accountId}-${Date.now()}@trading-platform.local`;
        const tempPassword = require('crypto').randomBytes(16).toString('hex');

        const newUser = await userService.registerUser(
          tempEmail,
          tempPassword,
          `Deriv User`,
          `${accounts[0].accountId}`
        );

        userId = newUser.id;
        isNewUser = true;
        logger.info('[OAuth] Created new OAuth user', { userId, email: tempEmail });
      } catch (error: any) {
        logger.error('[OAuth] Failed to create user account', error);
        throw createError(500, 'Failed to create user account for OAuth login');
      }
    }

    logger.info(`[OAuth] User ${userId} connecting ${accounts.length} account(s) via OAuth`, {
      accountIds: accounts.map((a) => a.accountId),
    });

    // Connect all accounts
    const connectedAccounts = await Promise.all(
      accounts.map((account) =>
        accountService.addDerivAccount(
          userId!,
          account.accountId,
          `${account.accountId} (${account.currency || 'USD'})`,
          account.token,
          'real' // OAuth tokens are typically from real accounts
        )
      )
    );

    // Set first account as default if no default exists
    const defaultAccount = await accountService.getDefaultAccount(userId);
    if (!defaultAccount && connectedAccounts.length > 0) {
      await accountService.setDefaultAccount(connectedAccounts[0].id, userId);
      logger.info(`[OAuth] Set default account to ${connectedAccounts[0].id}`);
    }

    // Sync balances for all newly connected accounts
    try {
      await Promise.all(
        connectedAccounts.map((acc) =>
          accountService.syncAccountBalance(acc.id).catch((err) => {
            logger.warn(`[OAuth] Failed to sync balance for ${acc.id}:`, err.message);
            return null;
          })
        )
      );
    } catch (error) {
      logger.warn('[OAuth] Balance sync encountered errors', error);
      // Don't fail the connection if balance sync fails
    }

    // Generate token for new users or use existing token for authenticated users
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

    res.status(201).json({
      success: true,
      message: `Successfully connected ${connectedAccounts.length} account(s)`,
      accessToken,
      accounts: connectedAccounts.map((acc) => ({
        id: acc.id,
        accountId: acc.accountId,
        accountName: acc.accountName,
        currency: acc.currency,
        balance: acc.balance,
        connectionStatus: acc.connectionStatus,
      })),
    });
  } catch (error: any) {
    logger.error('[OAuth] Connection failed:', error);
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
