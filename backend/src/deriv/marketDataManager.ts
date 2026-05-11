import { logger } from '../utils/logger.js';
import { createError } from '../utils/errors.js';
import { DerivConnectionManager } from './connectionManager.js';
import { encryptionService } from '../utils/encryption.js';

interface CachedCandle {
  symbol: string;
  granularity: number;
  candles: any[];
  lastUpdate: Date;
  ttl: number; // Time to live in milliseconds
}

interface CachedTick {
  symbol: string;
  tick: any;
  timestamp: number;
}

/**
 * Manages market data caching, subscriptions, and real-time updates
 * Deduplicates subscriptions and manages multiple Deriv connections efficiently
 */
export class MarketDataManager {
  private connections = new Map<string, DerivConnectionManager>();
  private tickSubscriptions = new Map<string, Set<string>>();
  private candleSubscriptions = new Map<string, Set<string>>();
  private tickCache = new Map<string, CachedTick>();
  private candleCache = new Map<string, CachedCandle>();
  private subscriptionHandlers = new Map<string, Function[]>();
  private cacheCleanupInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.startCacheCleanup();
  }

  /**
   * Get or create connection for an account
   */
  async getConnection(accountId: string, token: string): Promise<DerivConnectionManager> {
    if (!this.connections.has(accountId)) {
      const connection = new DerivConnectionManager(token);
      try {
        await connection.connect();
        this.connections.set(accountId, connection);
        logger.info(`Created Deriv connection for account ${accountId}`);
      } catch (error) {
        logger.error(`Failed to create connection for account ${accountId}:`, error);
        throw error;
      }
    }

    return this.connections.get(accountId)!;
  }

  /**
   * Subscribe to tick stream for a symbol
   */
  async subscribeTicks(
    accountId: string,
    token: string,
    symbol: string,
    onTick: (tick: any) => void,
  ): Promise<string> {
    const connection = await this.getConnection(accountId, token);

    // Create subscription ID
    const subscriptionId = `tick:${accountId}:${symbol}`;

    // Register callback
    this.registerSubscriptionHandler(subscriptionId, onTick);

    // Check if already subscribed
    if (!this.isTickSubscribed(symbol, subscriptionId)) {
      try {
        const response = await connection.subscribeTicks(symbol);

        if (response.subscription?.id) {
          // Register server subscription handler
          connection.registerSubscriptionHandler(response.subscription.id, (data: any) => {
            if (data.tick) {
              this.handleTickUpdate(symbol, data.tick);
            }
          });

          if (!this.tickSubscriptions.has(symbol)) {
            this.tickSubscriptions.set(symbol, new Set());
          }
          this.tickSubscriptions.get(symbol)!.add(subscriptionId);

          logger.info(`Subscribed to ticks for ${symbol}`, { accountId, subscriptionId });
        }
      } catch (error) {
        logger.error(`Failed to subscribe to ticks for ${symbol}:`, error);
        throw error;
      }
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from tick stream
   */
  async unsubscribeTicks(subscriptionId: string): Promise<void> {
    const [, , symbol] = subscriptionId.split(':');

    if (symbol) {
      const subscribers = this.tickSubscriptions.get(symbol);
      if (subscribers) {
        subscribers.delete(subscriptionId);
        if (subscribers.size === 0) {
          this.tickSubscriptions.delete(symbol);
        }
      }
    }

    this.subscriptionHandlers.delete(subscriptionId);
  }

  /**
   * Subscribe to candle stream (OHLC)
   */
  async subscribeCandles(
    accountId: string,
    token: string,
    symbol: string,
    granularity: number,
    onCandle: (candle: any) => void,
  ): Promise<string> {
    const connection = await this.getConnection(accountId, token);

    // Create subscription ID
    const subscriptionId = `candle:${accountId}:${symbol}:${granularity}`;

    // Register callback
    this.registerSubscriptionHandler(subscriptionId, onCandle);

    // Check if already subscribed
    const candleKey = `${symbol}:${granularity}`;
    if (!this.isCandleSubscribed(candleKey, subscriptionId)) {
      try {
        const response = await connection.subscribeCandles(symbol, granularity);

        if (response.subscription?.id) {
          // Register server subscription handler
          connection.registerSubscriptionHandler(response.subscription.id, (data: any) => {
            if (data.candles) {
              this.handleCandleUpdate(candleKey, data.candles);
            } else if (data.ohlc) {
              this.handleCandleUpdate(candleKey, data.ohlc);
            }
          });

          if (!this.candleSubscriptions.has(candleKey)) {
            this.candleSubscriptions.set(candleKey, new Set());
          }
          this.candleSubscriptions.get(candleKey)!.add(subscriptionId);

          logger.info(`Subscribed to candles for ${symbol} (${granularity}s)`, { accountId, subscriptionId });
        }
      } catch (error) {
        logger.error(`Failed to subscribe to candles:`, error);
        throw error;
      }
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from candle stream
   */
  async unsubscribeCandles(subscriptionId: string): Promise<void> {
    const [, , symbol, granularity] = subscriptionId.split(':');

    if (symbol && granularity) {
      const candleKey = `${symbol}:${granularity}`;
      const subscribers = this.candleSubscriptions.get(candleKey);
      if (subscribers) {
        subscribers.delete(subscriptionId);
        if (subscribers.size === 0) {
          this.candleSubscriptions.delete(candleKey);
        }
      }
    }

    this.subscriptionHandlers.delete(subscriptionId);
  }

  /**
   * Get cached tick data
   */
  getTickCache(symbol: string): any | null {
    const cached = this.tickCache.get(symbol);
    return cached ? cached.tick : null;
  }

  /**
   * Get cached candle data
   */
  getCandleCache(symbol: string, granularity: number): any[] | null {
    const key = `${symbol}:${granularity}`;
    const cached = this.candleCache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.lastUpdate.getTime() > cached.ttl) {
      this.candleCache.delete(key);
      return null;
    }

    return cached.candles;
  }

  /**
   * Get available symbols
   */
  async getSymbols(accountId: string, token: string): Promise<any[]> {
    const connection = await this.getConnection(accountId, token);
    const response = await connection.getSymbols();
    return response.active_symbols || [];
  }

  /**
   * Get account balance
   */
  async getBalance(accountId: string, token: string): Promise<any> {
    const connection = await this.getConnection(accountId, token);
    return await connection.getBalance();
  }

  /**
   * Place a trade
   */
  async placeTrade(
    accountId: string,
    token: string,
    tradePayload: Record<string, any>,
  ): Promise<any> {
    const connection = await this.getConnection(accountId, token);
    return await connection.buyContract(tradePayload);
  }

  /**
   * Close a trade
   */
  async closeTrade(accountId: string, token: string, contractId: string, price?: number): Promise<any> {
    const connection = await this.getConnection(accountId, token);
    return await connection.sellContract(contractId, price);
  }

  /**
   * Get open contracts
   */
  async getOpenContracts(accountId: string, token: string): Promise<any> {
    const connection = await this.getConnection(accountId, token);
    return await connection.getOpenContracts();
  }

  /**
   * Get closed contracts
   */
  async getClosedContracts(accountId: string, token: string, limit?: number): Promise<any> {
    const connection = await this.getConnection(accountId, token);
    return await connection.getClosedContracts(limit);
  }

  /**
   * Get historical candles
   */
  async getHistoricalCandles(
    accountId: string,
    token: string,
    symbol: string,
    granularity: number,
    count?: number,
  ): Promise<any> {
    const connection = await this.getConnection(accountId, token);
    const response = await connection.getCandles(symbol, granularity);
    return response.candles || [];
  }

  /**
   * Close all connections
   */
  closeAllConnections(): void {
    for (const connection of this.connections.values()) {
      connection.disconnect();
    }
    this.connections.clear();
    this.tickSubscriptions.clear();
    this.candleSubscriptions.clear();
    this.subscriptionHandlers.clear();

    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
  }

  /**
   * Close connection for specific account
   */
  closeConnection(accountId: string): void {
    const connection = this.connections.get(accountId);
    if (connection) {
      connection.disconnect();
      this.connections.delete(accountId);
    }

    // Clean up subscriptions for this account
    for (const [, subscribers] of this.tickSubscriptions) {
      const toRemove: string[] = [];
      for (const sub of subscribers) {
        if (sub.includes(accountId)) {
          toRemove.push(sub);
        }
      }
      toRemove.forEach((sub) => subscribers.delete(sub));
    }

    for (const [, subscribers] of this.candleSubscriptions) {
      const toRemove: string[] = [];
      for (const sub of subscribers) {
        if (sub.includes(accountId)) {
          toRemove.push(sub);
        }
      }
      toRemove.forEach((sub) => subscribers.delete(sub));
    }
  }

  /**
   * Private methods
   */
  private registerSubscriptionHandler(subscriptionId: string, handler: Function): void {
    if (!this.subscriptionHandlers.has(subscriptionId)) {
      this.subscriptionHandlers.set(subscriptionId, []);
    }
    this.subscriptionHandlers.get(subscriptionId)!.push(handler);
  }

  private isTickSubscribed(symbol: string, subscriptionId: string): boolean {
    const subscribers = this.tickSubscriptions.get(symbol);
    return subscribers ? subscribers.has(subscriptionId) : false;
  }

  private isCandleSubscribed(candleKey: string, subscriptionId: string): boolean {
    const subscribers = this.candleSubscriptions.get(candleKey);
    return subscribers ? subscribers.has(subscriptionId) : false;
  }

  private handleTickUpdate(symbol: string, tick: any): void {
    // Update cache
    this.tickCache.set(symbol, {
      symbol,
      tick,
      timestamp: tick.epoch || Date.now(),
    });

    // Call all handlers
    const subscriptionKey = `tick:${symbol}`;
    const subscribers = this.tickSubscriptions.get(symbol);
    if (subscribers) {
      for (const subscriptionId of subscribers) {
        const handlers = this.subscriptionHandlers.get(subscriptionId);
        if (handlers) {
          handlers.forEach((handler) => handler(tick));
        }
      }
    }
  }

  private handleCandleUpdate(candleKey: string, candles: any[]): void {
    const [symbol, granularity] = candleKey.split(':');

    // Update cache
    this.candleCache.set(candleKey, {
      symbol,
      granularity: parseInt(granularity),
      candles: Array.isArray(candles) ? candles : [candles],
      lastUpdate: new Date(),
      ttl: this.CACHE_TTL,
    });

    // Call all handlers
    const subscribers = this.candleSubscriptions.get(candleKey);
    if (subscribers) {
      for (const subscriptionId of subscribers) {
        const handlers = this.subscriptionHandlers.get(subscriptionId);
        if (handlers) {
          const candleData = Array.isArray(candles) ? candles[candles.length - 1] : candles;
          handlers.forEach((handler) => handler(candleData));
        }
      }
    }
  }

  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();

      // Clean up candle cache
      for (const [key, cached] of this.candleCache) {
        if (now - cached.lastUpdate.getTime() > cached.ttl) {
          this.candleCache.delete(key);
        }
      }

      // Clean up tick cache (older than 1 hour)
      for (const [symbol, cached] of this.tickCache) {
        if (now - cached.timestamp > 3600000) {
          this.tickCache.delete(symbol);
        }
      }
    }, 60000); // Run every minute
  }
}

export const marketDataManager = new MarketDataManager();
