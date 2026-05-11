import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.js';
import { DerivAccount } from '../models/DerivAccount.js';
import { User } from '../models/User.js';
import { encryptionService } from '../utils/encryption.js';
import { logger } from '../utils/logger.js';
import { createError } from '../utils/errors.js';
import { ENV } from '../config/env.js';

interface AuthorizeResponse {
  authorize?: {
    account_type?: string;
    currency?: string;
    is_virtual?: number;
    loginid?: string;
    email?: string;
  };
  echo_req?: any;
  msg_type?: string;
  req_id?: number;
  error?: {
    code: string;
    message: string;
  };
}

interface TickResponse {
  tick?: {
    symbol: string;
    quote: number;
    epoch: number;
  };
  subscription?: {
    id: string;
  };
}

export class DerivAuthService {
  private derivAccountRepo = AppDataSource.getRepository(DerivAccount);
  private userRepo = AppDataSource.getRepository(User);
  private connections = new Map<string, WebSocket>();
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();

  /**
   * Authorize and validate a Deriv API token
   * Returns account info if valid
   */
  async validateAndAuthorizeToken(token: string): Promise<AuthorizeResponse['authorize']> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(ENV.DERIV.API_URL);
        const timeoutHandle = setTimeout(() => {
          ws.close();
          reject(createError(408, 'Deriv authorization timeout'));
        }, 10000);

        ws.onopen = () => {
          const req = this.buildAuthRequest(token);
          ws.send(JSON.stringify(req));
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data as string) as AuthorizeResponse;

            if (response.error) {
              clearTimeout(timeoutHandle);
              ws.close();
              reject(createError(401, `Deriv auth error: ${response.error.message}`));
              return;
            }

            if (response.authorize) {
              clearTimeout(timeoutHandle);
              ws.close();
              resolve(response.authorize);
            }
          } catch (error) {
            clearTimeout(timeoutHandle);
            ws.close();
            reject(error);
          }
        };

        ws.onerror = (error) => {
          clearTimeout(timeoutHandle);
          reject(createError(500, `WebSocket error: ${error.message}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add a Deriv account to a user
   */
  async addDerivAccount(
    userId: string,
    token: string,
    accountName?: string,
  ): Promise<DerivAccount> {
    // Validate token first
    let authData: AuthorizeResponse['authorize'];
    try {
      authData = await this.validateAndAuthorizeToken(token);
    } catch (error: any) {
      throw createError(401, `Invalid Deriv token: ${error.message}`);
    }

    if (!authData?.loginid) {
      throw createError(400, 'Invalid Deriv account response');
    }

    // Check if account already exists
    const existingAccount = await this.derivAccountRepo.findOne({
      where: { accountId: authData.loginid },
    });

    if (existingAccount && existingAccount.userId !== userId) {
      throw createError(409, 'This Deriv account is already connected to another user');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw createError(404, 'User not found');
    }

    // Encrypt token
    const encryptedToken = encryptionService.encrypt(token);

    // Determine if demo or real account
    const accountType = (authData.is_virtual === 1 ? 'demo' : 'real') as 'demo' | 'real';

    // Create or update account
    let account = existingAccount || this.derivAccountRepo.create();
    account.userId = userId;
    account.accountId = authData.loginid;
    account.accountName = accountName || `${accountType.toUpperCase()} - ${authData.email || authData.loginid}`;
    account.accountType = accountType;
    account.encryptedToken = encryptedToken;
    account.currency = authData.currency || 'USD';
    account.connectionStatus = 'connected';
    account.isActive = true;

    // If this is the first account, set as default
    if (!existingAccount) {
      const userAccounts = await this.derivAccountRepo.find({ where: { userId } });
      if (userAccounts.length === 0) {
        account.isDefault = true;
      }
    }

    return await this.derivAccountRepo.save(account);
  }

  /**
   * Get available balance for a Deriv account
   */
  async getAccountBalance(accountId: string): Promise<{
    balance: number;
    available: number;
    currency: string;
  }> {
    const account = await this.derivAccountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw createError(404, 'Account not found');
    }

    return new Promise((resolve, reject) => {
      try {
        const decryptedToken = encryptionService.decrypt(account.encryptedToken);
        const ws = new WebSocket(ENV.DERIV.API_URL);
        const timeoutHandle = setTimeout(() => {
          ws.close();
          reject(createError(408, 'Balance fetch timeout'));
        }, 10000);

        ws.onopen = () => {
          ws.send(JSON.stringify({ authorize: decryptedToken }));
        };

        let authorized = false;

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data as string);

            if (!authorized && response.authorize) {
              authorized = true;
              ws.send(JSON.stringify({ balance: 1, req_id: this.getNextRequestId() }));
              return;
            }

            if (response.balance) {
              clearTimeout(timeoutHandle);
              ws.close();

              resolve({
                balance: response.balance.balance,
                available: response.balance.balance,
                currency: response.balance.currency || account.currency,
              });
            }

            if (response.error) {
              clearTimeout(timeoutHandle);
              ws.close();
              reject(createError(400, response.error.message));
            }
          } catch (error) {
            clearTimeout(timeoutHandle);
            ws.close();
            reject(error);
          }
        };

        ws.onerror = (error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get decrypted token for a Deriv account
   */
  async getDecryptedToken(accountId: string, userId?: string): Promise<string> {
    const where: any = { id: accountId };
    if (userId) {
      where.userId = userId;
    }

    const account = await this.derivAccountRepo.findOne({ where });
    if (!account || !account.encryptedToken) {
      throw createError(404, 'Account not found');
    }

    return encryptionService.decrypt(account.encryptedToken);
  }

  /**
   * Switch default account for a user
   */
  async setDefaultAccount(accountId: string, userId: string): Promise<void> {
    // Verify account belongs to user
    const account = await this.derivAccountRepo.findOne({ where: { id: accountId, userId } });
    if (!account) {
      throw createError(404, 'Account not found');
    }

    // Remove default from other accounts
    await AppDataSource.createQueryBuilder()
      .update(DerivAccount)
      .set({ isDefault: false })
      .where('userId = :userId', { userId })
      .execute();

    // Set as default
    await AppDataSource.createQueryBuilder()
      .update(DerivAccount)
      .set({ isDefault: true })
      .where('id = :accountId', { accountId })
      .execute();
  }

  /**
   * List all Deriv accounts for a user
   */
  async getUserAccounts(userId: string): Promise<DerivAccount[]> {
    return await this.derivAccountRepo.find({
      where: { userId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Get default account for a user
   */
  async getDefaultAccount(userId: string): Promise<DerivAccount | null> {
    return await this.derivAccountRepo.findOne({
      where: { userId, isDefault: true, isActive: true },
    });
  }

  /**
   * Delete a Deriv account (soft delete)
   */
  async deleteAccount(accountId: string, userId: string): Promise<void> {
    const account = await this.derivAccountRepo.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw createError(404, 'Account not found');
    }

    // If this was the default account, set another as default
    if (account.isDefault) {
      const otherAccount = await this.derivAccountRepo.findOne({
        where: { userId, isActive: true, id: account.id },
        order: { createdAt: 'DESC' },
      });

      if (!otherAccount) {
        const nextDefault = await this.derivAccountRepo.findOne({
          where: { userId, isActive: true },
          order: { createdAt: 'DESC' },
        });

        if (nextDefault) {
          nextDefault.isDefault = true;
          await this.derivAccountRepo.save(nextDefault);
        }
      }
    }

    account.isActive = false;
    await this.derivAccountRepo.save(account);
  }

  /**
   * Sync all active accounts for a user (fetch latest balances)
   */
  async syncUserAccounts(userId: string): Promise<DerivAccount[]> {
    const accounts = await this.getUserAccounts(userId);

    const results = await Promise.allSettled(
      accounts.map(async (account) => {
        try {
          const balance = await this.getAccountBalance(account.id);
          account.balance = balance.balance;
          account.lastSyncedAt = new Date();
          account.connectionStatus = 'connected';
          return await this.derivAccountRepo.save(account);
        } catch (error) {
          account.connectionStatus = 'error';
          await this.derivAccountRepo.save(account);
          logger.error(`Failed to sync account ${account.id}:`, error);
          return account;
        }
      }),
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<DerivAccount>).value);
  }

  /**
   * Get account info
   */
  async getAccountInfo(accountId: string, userId?: string): Promise<DerivAccount> {
    const where: any = { id: accountId };
    if (userId) {
      where.userId = userId;
    }

    const account = await this.derivAccountRepo.findOne({ where });
    if (!account) {
      throw createError(404, 'Account not found');
    }

    return account;
  }

  /**
   * Private helpers
   */
  private buildAuthRequest(token: string, reqId?: number): Record<string, any> {
    return {
      authorize: token,
      req_id: reqId || this.getNextRequestId(),
    };
  }

  private getNextRequestId(): number {
    return ++this.requestId;
  }

  /**
   * Clean up WebSocket connections
   */
  closeConnection(accountId: string): void {
    const ws = this.connections.get(accountId);
    if (ws) {
      ws.close();
      this.connections.delete(accountId);
    }
  }

  /**
   * Clean up all connections
   */
  closeAllConnections(): void {
    for (const ws of this.connections.values()) {
      ws.close();
    }
    this.connections.clear();
  }
}

export const derivAuthService = new DerivAuthService();
