import WebSocket from 'ws';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

export class DerivAPIClient {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, any>();
  private messageHandlers = new Map<string, Function>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;

  constructor(private appId: string = ENV.DERIV.APP_ID) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(ENV.DERIV.API_URL);

        this.ws.onopen = () => {
          logger.info('Connected to Deriv API');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event: WebSocket.MessageEvent) => {
          this.handleMessage(JSON.parse(event.data as string));
        };

        this.ws.onerror = (error: WebSocket.ErrorEvent) => {
          logger.error('Deriv WebSocket error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          logger.warn('Deriv WebSocket closed');
          this.isConnected = false;
          this.attemptReconnect();
        };
      } catch (error) {
        logger.error('Failed to connect to Deriv API', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect().catch((error) => {
          logger.error('Reconnection failed', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(message: any): void {
    // Handle responses to specific requests
    if (message.req_id) {
      const handler = this.pendingRequests.get(message.req_id);
      if (handler) {
        handler(message);
        this.pendingRequests.delete(message.req_id);
      }
    }

    // Handle subscription messages
    const handlers = this.messageHandlers.get(message.msg_type || 'default');
    if (handlers) {
      handlers(message);
    }
  }

  async authorize(token: string): Promise<any> {
    return this.sendRequest({
      authorize: token,
    });
  }

  async getTradingPlatformStatus(): Promise<any> {
    return this.sendRequest({
      trading_platform_status: 1,
    });
  }

  async getActivePayouts(): Promise<any> {
    return this.sendRequest({
      active_payouts: 1,
      product_type: 'multi_barrier',
    });
  }

  async getAccountSettings(): Promise<any> {
    return this.sendRequest({
      get_account_settings: 1,
    });
  }

  async getBalance(): Promise<any> {
    return this.sendRequest({
      balance: 1,
    });
  }

  async getStatement(): Promise<any> {
    return this.sendRequest({
      statement: 1,
      limit: 50,
    });
  }

  async buyContract(proposal: any): Promise<any> {
    return this.sendRequest({
      buy: proposal.id,
      price: proposal.ask_price,
    });
  }

  async subscribeToTicks(symbol: string): Promise<any> {
    const request = {
      ticks: symbol,
      subscribe: 1,
    };
    return this.sendRequest(request);
  }

  async subscribeToPrices(symbols: string[]): Promise<any> {
    const request = {
      proposal_subscription: 1,
      subscribe: 1,
      contract_type: 'CALL',
      currency: 'USD',
      basis: 'stake',
      amount: 10,
      symbol: symbols[0],
    };
    return this.sendRequest(request);
  }

  async unsubscribeFromTicks(id: number): Promise<void> {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        forget: id,
      }));
    }
  }

  private async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.requestId++;
      const reqId = this.requestId;

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(new Error('Request timeout'));
      }, 10000);

      this.pendingRequests.set(reqId, (response: any) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });

      try {
        this.ws.send(JSON.stringify({
          ...request,
          req_id: reqId,
        }));
      } catch (error) {
        this.pendingRequests.delete(reqId);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  registerMessageHandler(msgType: string, handler: Function): void {
    this.messageHandlers.set(msgType, handler);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  isWebSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

export const derivAPI = new DerivAPIClient();
