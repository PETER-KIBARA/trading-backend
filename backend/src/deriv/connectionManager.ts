import WebSocket from 'ws';
import { logger } from '../utils/logger.js';
import { createError } from '../utils/errors.js';
import { ENV } from '../config/env.js';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}

interface SubscriptionHandler {
  id: string;
  handler: (data: any) => void;
}

/**
 * Manages a single WebSocket connection to Deriv API
 * Handles reconnection, request correlation, and subscriptions
 */
export class DerivConnectionManager {
  private ws: WebSocket | null = null;
  private token: string;
  private requestId = 0;
  private pendingRequests = new Map<number, PendingRequest>();
  private subscriptionHandlers = new Map<string, SubscriptionHandler[]>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private messageHandlers = new Map<string, Function[]>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private requestTimeout = 30000;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Establish WebSocket connection to Deriv
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(ENV.DERIV.API_URL);

        const timeoutHandle = setTimeout(() => {
          if (this.ws) {
            this.ws.close();
          }
          reject(createError(408, 'Deriv connection timeout'));
        }, 10000);

        this.ws.onopen = async () => {
          clearTimeout(timeoutHandle);
          logger.info('Connected to Deriv WebSocket');

          try {
            // Authorize immediately
            await this.authorize();
            this.isConnected = true;
            this.reconnectAttempts = 0;

            // Start heartbeat
            this.startHeartbeat();

            resolve();
          } catch (error) {
            reject(error);
          }
        };

        this.ws.onmessage = (event: WebSocket.MessageEvent) => {
          try {
            this.handleMessage(JSON.parse(event.data as string));
          } catch (error) {
            logger.error('Message parsing error:', error);
          }
        };

        this.ws.onerror = (event: WebSocket.ErrorEvent) => {
          logger.error('WebSocket error:', event);
          clearTimeout(timeoutHandle);
          this.isConnected = false;
        };

        this.ws.onclose = () => {
          logger.warn('Deriv WebSocket closed');
          clearTimeout(timeoutHandle);
          this.isConnected = false;
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Authorize connection with token
   */
  private authorize(): Promise<any> {
    return this.sendRequest({
      authorize: this.token,
    });
  }

  /**
   * Send a request and wait for response
   */
  async sendRequest(payload: Record<string, any>): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw createError(503, 'Connection not ready');
    }

    const reqId = this.getNextRequestId();
    const enrichedPayload = { ...payload, req_id: reqId };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(createError(408, `Request timeout (req_id: ${reqId})`));
      }, this.requestTimeout);

      this.pendingRequests.set(reqId, { resolve, reject, timeout });

      try {
        this.ws!.send(JSON.stringify(enrichedPayload));
      } catch (error) {
        this.pendingRequests.delete(reqId);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to a stream (e.g., ticks, candles)
   */
  registerSubscriptionHandler(
    subscriptionId: string,
    handler: (data: any) => void,
  ): () => void {
    if (!this.subscriptionHandlers.has(subscriptionId)) {
      this.subscriptionHandlers.set(subscriptionId, []);
    }

    this.subscriptionHandlers.get(subscriptionId)!.push({ id: subscriptionId, handler });

    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptionHandlers.get(subscriptionId);
      if (handlers) {
        const index = handlers.findIndex((h) => h.id === subscriptionId);
        if (index > -1) {
          handlers.splice(index, 1);
        }

        if (handlers.length === 0) {
          this.subscriptionHandlers.delete(subscriptionId);
        }
      }
    };
  }

  /**
   * Register a message handler for a specific event type
   */
  onMessage(type: string, handler: Function): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }

    this.messageHandlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<any> {
    return this.sendRequest({ balance: 1 });
  }

  /**
   * Get trading platform account stats
   */
  async getAccountStats(): Promise<any> {
    return this.sendRequest({ account_statistics: 1 });
  }

  /**
   * Get asset symbols (markets)
   */
  async getSymbols(): Promise<any> {
    return this.sendRequest({ active_symbols: 'brief' });
  }

  /**
   * Subscribe to ticks for a symbol
   */
  async subscribeTicks(symbol: string): Promise<any> {
    return this.sendRequest({
      ticks: symbol,
      subscribe: 1,
    });
  }

  /**
   * Unsubscribe from ticks
   */
  async unsubscribeTicks(subscriptionId: string): Promise<any> {
    return this.sendRequest({
      forget: subscriptionId,
    });
  }

  /**
   * Subscribe to candles (OHLC)
   */
  async subscribeCandles(symbol: string, granularity: number): Promise<any> {
    return this.sendRequest({
      candles: symbol,
      granularity,
      subscribe: 1,
    });
  }

  /**
   * Get historical candles
   */
  async getCandles(symbol: string, granularity: number, start?: number): Promise<any> {
    const payload: any = {
      candles: symbol,
      granularity,
      count: 100,
    };

    if (start) {
      payload.start = start;
    }

    return this.sendRequest(payload);
  }

  /**
   * Place a trade (buy)
   */
  async buyContract(payload: Record<string, any>): Promise<any> {
    return this.sendRequest({
      buy: 1,
      ...payload,
    });
  }

  /**
   * Close a contract (sell)
   */
  async sellContract(contractId: string, price?: number): Promise<any> {
    const payload: any = {
      sell: contractId,
    };

    if (price !== undefined) {
      payload.price = price;
    }

    return this.sendRequest(payload);
  }

  /**
   * Get open contracts
   */
  async getOpenContracts(): Promise<any> {
    return this.sendRequest({ portfolio: 1 });
  }

  /**
   * Get closed contracts
   */
  async getClosedContracts(limit: number = 50): Promise<any> {
    return this.sendRequest({
      profit_table: 1,
      limit,
    });
  }

  /**
   * Check connection status
   */
  isReady(): boolean {
    return this.isConnected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Close connection
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.pendingRequests.clear();
    this.subscriptionHandlers.clear();
    this.messageHandlers.clear();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  /**
   * Private methods
   */
  private handleMessage(message: any): void {
    // Handle response to specific request
    if (message.req_id && this.pendingRequests.has(message.req_id)) {
      const pending = this.pendingRequests.get(message.req_id);

      if (message.error) {
        pending!.reject(createError(400, message.error.message));
      } else {
        pending!.resolve(message);
      }

      clearTimeout(pending!.timeout);
      this.pendingRequests.delete(message.req_id);
      return;
    }

    // Handle subscription messages
    if (message.subscription?.id) {
      const handlers = this.subscriptionHandlers.get(message.subscription.id);
      if (handlers) {
        for (const handler of handlers) {
          handler.handler(message);
        }
      }
    }

    // Handle other message types
    if (message.msg_type) {
      const handlers = this.messageHandlers.get(message.msg_type);
      if (handlers) {
        for (const handler of handlers) {
          handler(message);
        }
      }
    }

    // Handle ping
    if (message.ping) {
      this.ws?.send(JSON.stringify({ pong: 1 }));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.ping();
        } catch (error) {
          logger.error('Heartbeat failed:', error);
        }
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
      logger.info(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`,
      );

      setTimeout(() => {
        this.connect().catch((error) => {
          logger.error('Reconnection failed:', error);
        });
      }, delay);
    }
  }

  private getNextRequestId(): number {
    return ++this.requestId;
  }
}
