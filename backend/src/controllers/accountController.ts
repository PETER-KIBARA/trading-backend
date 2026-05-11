import { Response } from 'express';
import { accountService } from '../services/accountService.js';
import { derivAuthService } from '../services/derivAuthService.js';
import { AuthRequest } from '../middleware/auth.js';
import { getWebSocketManager } from '../websocket/manager.js';
import { createError } from '../utils/errors.js';

/**
 * Connect a Deriv account using API token
 */
export const connectDerivAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { token, accountName } = req.body;

    if (!token) {
      throw createError(400, 'Deriv API token required');
    }

    const account = await derivAuthService.addDerivAccount(req.userId, token, accountName);

    // Sync balance immediately
    try {
      await accountService.syncAccountBalance(account.id);
    } catch (error) {
      // Log error but don't fail the connection
      console.error('Failed to sync balance:', error);
    }

    res.status(201).json({
      message: 'Deriv account connected successfully',
      account: {
        id: account.id,
        accountId: account.accountId,
        accountName: account.accountName,
        accountType: account.accountType,
        currency: account.currency,
        balance: account.balance,
        isDefault: account.isDefault,
        connectionStatus: account.connectionStatus,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Add account (legacy, same as connectDerivAccount)
 */
export const addAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  return connectDerivAccount(req, res);
};

export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const accounts = await accountService.getUserAccounts(req.userId);

    res.json({
      accounts: accounts.map((acc) => ({
        id: acc.id,
        accountId: acc.accountId,
        accountName: acc.accountName,
        accountType: acc.accountType,
        balance: acc.balance,
        currency: acc.currency,
        isDefault: acc.isDefault,
        connectionStatus: acc.connectionStatus,
        lastSyncedAt: acc.lastSyncedAt,
        createdAt: acc.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get specific account details
 */
export const getAccountById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;
    const account = await accountService.getAccountByIdAndUser(accountId, req.userId);

    res.json({
      account: {
        id: account.id,
        accountId: account.accountId,
        accountName: account.accountName,
        accountType: account.accountType,
        balance: account.balance,
        currency: account.currency,
        isDefault: account.isDefault,
        connectionStatus: account.connectionStatus,
        settings: account.settings,
        lastSyncedAt: account.lastSyncedAt,
        createdAt: account.createdAt,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Sync account balance from Deriv
 */
export const syncBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    const balance = await accountService.syncAccountBalance(accountId);

    // Broadcast balance update via WebSocket
    const wsManager = getWebSocketManager();
    wsManager.broadcastBalanceUpdate(req.userId, accountId, balance);

    res.json({
      message: 'Balance synchronized',
      balance,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Sync all accounts for user
 */
export const syncAllBalances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const accounts = await accountService.syncAllUserAccounts(req.userId);

    res.json({
      message: 'All accounts synchronized',
      accounts: accounts.map((acc) => ({
        id: acc.id,
        accountId: acc.accountId,
        balance: acc.balance,
        connectionStatus: acc.connectionStatus,
      })),
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Update account settings
 */
export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;
    const { settings } = req.body;

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    const account = await accountService.updateAccountSettings(accountId, settings);

    res.json({
      message: 'Settings updated',
      account: {
        id: account.id,
        settings: account.settings,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Set account as default
 */
export const setDefault = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    await accountService.setDefaultAccount(accountId, req.userId);

    res.json({
      message: 'Default account updated',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Delete account (soft delete)
 */
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    await accountService.deleteAccount(accountId, req.userId);

    res.json({
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get default account
 */
export const getDefaultAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const account = await accountService.getDefaultAccount(req.userId);

    if (!account) {
      throw createError(404, 'No default account found');
    }

    res.json({
      account: {
        id: account.id,
        accountId: account.accountId,
        accountName: account.accountName,
        accountType: account.accountType,
        balance: account.balance,
        currency: account.currency,
        isDefault: account.isDefault,
        connectionStatus: account.connectionStatus,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
