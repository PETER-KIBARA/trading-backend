import { AppDataSource } from '../config/database.js';
import { DerivAccount } from '../models/DerivAccount.js';
import { createError } from '../utils/errors.js';
import { derivAuthService } from './derivAuthService.js';
import { logger } from '../utils/logger.js';

export class AccountService {
  private accountRepo = AppDataSource.getRepository(DerivAccount);

  /**
   * Add a Deriv account using token (delegates to derivAuthService)
   */
  async addDerivAccount(
    userId: string,
    accountId: string,
    accountName: string,
    token: string,
    accountType?: 'real' | 'demo',
  ): Promise<DerivAccount> {
    return await derivAuthService.addDerivAccount(userId, token, accountName);
  }

  async getAccountByIdAndUser(accountId: string, userId: string): Promise<DerivAccount> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw createError(404, 'Account not found');
    }

    return account;
  }

  async getUserAccounts(userId: string): Promise<DerivAccount[]> {
    return await derivAuthService.getUserAccounts(userId);
  }

  async getDefaultAccount(userId: string): Promise<DerivAccount | null> {
    return await derivAuthService.getDefaultAccount(userId);
  }

  async getDecryptedToken(accountId: string, userId?: string): Promise<string> {
    return await derivAuthService.getDecryptedToken(accountId, userId);
  }

  async syncAccountBalance(accountId: string): Promise<number> {
    try {
      const account = await this.accountRepo.findOne({ where: { id: accountId } });
      if (!account) {
        throw createError(404, 'Account not found');
      }

      const balanceData = await derivAuthService.getAccountBalance(accountId);
      account.balance = balanceData.balance;
      account.lastSyncedAt = new Date();
      account.connectionStatus = 'connected';
      await this.accountRepo.save(account);

      return account.balance;
    } catch (error: any) {
      const account = await this.accountRepo.findOne({ where: { id: accountId } });
      if (account) {
        account.connectionStatus = 'error';
        await this.accountRepo.save(account);
      }
      logger.error(`Failed to sync balance for account ${accountId}:`, error);
      throw error;
    }
  }

  async syncAllUserAccounts(userId: string): Promise<DerivAccount[]> {
    return await derivAuthService.syncUserAccounts(userId);
  }

  async updateAccountSettings(
    accountId: string,
    settings: Record<string, any>,
  ): Promise<DerivAccount> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw createError(404, 'Account not found');
    }

    account.settings = { ...account.settings, ...settings };
    return await this.accountRepo.save(account);
  }

  async deleteAccount(accountId: string, userId: string): Promise<void> {
    await derivAuthService.deleteAccount(accountId, userId);
  }

  async setDefaultAccount(accountId: string, userId: string): Promise<void> {
    await derivAuthService.setDefaultAccount(accountId, userId);
  }
}

export const accountService = new AccountService();
