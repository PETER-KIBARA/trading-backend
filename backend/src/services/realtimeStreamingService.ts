import { getWebSocketManager } from '../websocket/manager.js';
import { marketDataManager } from '../deriv/marketDataManager.js';
import { derivAuthService } from '../services/derivAuthService.js';
import { logger } from '../utils/logger.js';
import { createError } from '../utils/errors.js';

interface TickSubscription {
  accountId: string;
  userId: string;
  symbol: string;
  subscriptionId?: string;
}

interface CandleSubscription {
  accountId: string;
  userId: string;
  symbol: string;
  granularity: number;
  subscriptionId?: string;
}

/**
 * Service for managing real-time market data streaming
 * Bridges Deriv market data with Socket.IO broadcasting to clients
 */
export class RealtimeStreamingService {
  private tickSubscriptions = new Map<string, TickSubscription>();
  private candleSubscriptions = new Map<string, CandleSubscription>();
  private activeStreams = new Map<string, boolean>();

  /**
   * Subscribe user to live ticks for a symbol
   */
  async subscribeToTicks(userId: string, accountId: string, symbol: string): Promise<string> {
    const subscriptionKey = `${userId}:${accountId}:tick:${symbol}`;

    // Avoid duplicate subscriptions
    if (this.tickSubscriptions.has(subscriptionKey)) {
      return this.tickSubscriptions.get(subscriptionKey)!.subscriptionId || subscriptionKey;
    }

    try {
      const token = await derivAuthService.getDecryptedToken(accountId, userId);

      const subscriptionId = await marketDataManager.subscribeTicks(
        accountId,
        token,
        symbol,
        (tick: any) => {
          this.broadcastTickUpdate(userId, accountId, symbol, tick);
        },
      );

      this.tickSubscriptions.set(subscriptionKey, {
        accountId,
        userId,
        symbol,
        subscriptionId,
      });

      logger.info(`User subscribed to ticks`, { userId, accountId, symbol, subscriptionId });

      return subscriptionId;
    } catch (error) {
      logger.error(`Failed to subscribe to ticks:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from tick stream
   */
  async unsubscribeFromTicks(userId: string, accountId: string, symbol: string): Promise<void> {
    const subscriptionKey = `${userId}:${accountId}:tick:${symbol}`;
    const subscription = this.tickSubscriptions.get(subscriptionKey);

    if (subscription && subscription.subscriptionId) {
      try {
        await marketDataManager.unsubscribeTicks(subscription.subscriptionId);
        this.tickSubscriptions.delete(subscriptionKey);
        logger.info(`User unsubscribed from ticks`, { userId, accountId, symbol });
      } catch (error) {
        logger.error(`Failed to unsubscribe from ticks:`, error);
      }
    }
  }

  /**
   * Subscribe user to live candles for a symbol
   */
  async subscribeToCandles(
    userId: string,
    accountId: string,
    symbol: string,
    granularity: number,
  ): Promise<string> {
    const subscriptionKey = `${userId}:${accountId}:candle:${symbol}:${granularity}`;

    // Avoid duplicate subscriptions
    if (this.candleSubscriptions.has(subscriptionKey)) {
      return this.candleSubscriptions.get(subscriptionKey)!.subscriptionId || subscriptionKey;
    }

    try {
      const token = await derivAuthService.getDecryptedToken(accountId, userId);

      const subscriptionId = await marketDataManager.subscribeCandles(
        accountId,
        token,
        symbol,
        granularity,
        (candle: any) => {
          this.broadcastCandleUpdate(userId, accountId, symbol, granularity, candle);
        },
      );

      this.candleSubscriptions.set(subscriptionKey, {
        accountId,
        userId,
        symbol,
        granularity,
        subscriptionId,
      });

      logger.info(`User subscribed to candles`, {
        userId,
        accountId,
        symbol,
        granularity,
        subscriptionId,
      });

      return subscriptionId;
    } catch (error) {
      logger.error(`Failed to subscribe to candles:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from candle stream
   */
  async unsubscribeFromCandles(
    userId: string,
    accountId: string,
    symbol: string,
    granularity: number,
  ): Promise<void> {
    const subscriptionKey = `${userId}:${accountId}:candle:${symbol}:${granularity}`;
    const subscription = this.candleSubscriptions.get(subscriptionKey);

    if (subscription && subscription.subscriptionId) {
      try {
        await marketDataManager.unsubscribeCandles(subscription.subscriptionId);
        this.candleSubscriptions.delete(subscriptionKey);
        logger.info(`User unsubscribed from candles`, { userId, accountId, symbol, granularity });
      } catch (error) {
        logger.error(`Failed to unsubscribe from candles:`, error);
      }
    }
  }

  /**
   * Get available symbols for an account
   */
  async getAvailableSymbols(userId: string, accountId: string): Promise<any[]> {
    try {
      const token = await derivAuthService.getDecryptedToken(accountId, userId);
      return await marketDataManager.getSymbols(accountId, token);
    } catch (error) {
      logger.error(`Failed to get symbols:`, error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(userId: string, accountId: string): Promise<any> {
    try {
      const token = await derivAuthService.getDecryptedToken(accountId, userId);
      const response = await marketDataManager.getBalance(accountId, token);
      return response.balance;
    } catch (error) {
      logger.error(`Failed to get balance:`, error);
      throw error;
    }
  }

  /**
   * Get historical candles
   */
  async getHistoricalCandles(
    userId: string,
    accountId: string,
    symbol: string,
    granularity: number,
    count?: number,
  ): Promise<any[]> {
    try {
      const token = await derivAuthService.getDecryptedToken(accountId, userId);
      return await marketDataManager.getHistoricalCandles(
        accountId,
        token,
        symbol,
        granularity,
        count,
      );
    } catch (error) {
      logger.error(`Failed to get historical candles:`, error);
      throw error;
    }
  }

  /**
   * Clean up subscriptions for a user
   */
  unsubscribeUserAll(userId: string): void {
    const tickSubs = Array.from(this.tickSubscriptions.entries()).filter(
      ([, sub]) => sub.userId === userId,
    );

    const candleSubs = Array.from(this.candleSubscriptions.entries()).filter(
      ([, sub]) => sub.userId === userId,
    );

    for (const [key] of tickSubs) {
      this.tickSubscriptions.delete(key);
    }

    for (const [key] of candleSubs) {
      this.candleSubscriptions.delete(key);
    }

    logger.info(`Cleaned up subscriptions for user`, { userId });
  }

  /**
   * Clean up all subscriptions for a disconnected account
   */
  unsubscribeAccountAll(accountId: string): void {
    const tickSubs = Array.from(this.tickSubscriptions.entries()).filter(
      ([, sub]) => sub.accountId === accountId,
    );

    const candleSubs = Array.from(this.candleSubscriptions.entries()).filter(
      ([, sub]) => sub.accountId === accountId,
    );

    for (const [key, sub] of tickSubs) {
      if (sub.subscriptionId) {
        marketDataManager.unsubscribeTicks(sub.subscriptionId).catch((err) => {
          logger.error(`Failed to unsubscribe tick`, err);
        });
      }
      this.tickSubscriptions.delete(key);
    }

    for (const [key, sub] of candleSubs) {
      if (sub.subscriptionId) {
        marketDataManager.unsubscribeCandles(sub.subscriptionId).catch((err) => {
          logger.error(`Failed to unsubscribe candle`, err);
        });
      }
      this.candleSubscriptions.delete(key);
    }

    marketDataManager.closeConnection(accountId);
    logger.info(`Cleaned up subscriptions for account`, { accountId });
  }

  /**
   * Private methods
   */
  private broadcastTickUpdate(userId: string, accountId: string, symbol: string, tick: any): void {
    try {
      const wsManager = getWebSocketManager();
      wsManager.sendToUser(userId, 'market:tick', {
        accountId,
        symbol,
        quote: tick.quote,
        epoch: tick.epoch,
        bid: tick.bid,
        ask: tick.ask,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`Failed to broadcast tick update:`, error);
    }
  }

  private broadcastCandleUpdate(
    userId: string,
    accountId: string,
    symbol: string,
    granularity: number,
    candle: any,
  ): void {
    try {
      const wsManager = getWebSocketManager();
      wsManager.sendToUser(userId, 'market:candle', {
        accountId,
        symbol,
        granularity,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        epoch: candle.epoch,
        volume: candle.volume,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`Failed to broadcast candle update:`, error);
    }
  }
}

export const realtimeStreamingService = new RealtimeStreamingService();
