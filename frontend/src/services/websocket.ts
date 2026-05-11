import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
          query: { userId },
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          resolve();
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToAccount(accountId: string): void {
    this.socket?.emit('subscribe:account', accountId);
  }

  unsubscribeFromAccount(accountId: string): void {
    this.socket?.emit('unsubscribe:account', accountId);
  }

  subscribeToTrades(accountId: string): void {
    this.socket?.emit('subscribe:trades', accountId);
  }

  subscribeToBot(botId: string): void {
    this.socket?.emit('subscribe:bot', botId);
  }

  subscribeToMarketTicks(accountId: string, symbol: string): void {
    this.socket?.emit('market:subscribe-ticks', { accountId, symbol });
  }

  unsubscribeFromMarketTicks(accountId: string, symbol: string): void {
    this.socket?.emit('market:unsubscribe-ticks', { accountId, symbol });
  }

  subscribeToMarketCandles(accountId: string, symbol: string, granularity: number): void {
    this.socket?.emit('market:subscribe-candles', { accountId, symbol, granularity });
  }

  unsubscribeFromMarketCandles(accountId: string, symbol: string, granularity: number): void {
    this.socket?.emit('market:unsubscribe-candles', { accountId, symbol, granularity });
  }

  onBalanceUpdate(callback: (data: any) => void): void {
    this.socket?.on('balance:update', callback);
  }

  onTradeUpdate(callback: (data: any) => void): void {
    this.socket?.on('trade:update', callback);
  }

  onTradeOpened(callback: (data: any) => void): void {
    this.socket?.on('trade:opened', callback);
  }

  onTradeClosed(callback: (data: any) => void): void {
    this.socket?.on('trade:closed', callback);
  }

  onTickUpdate(callback: (data: any) => void): void {
    this.socket?.on('tick:update', callback);
  }

  onMarketTick(callback: (data: any) => void): void {
    this.socket?.on('market:tick', callback);
  }

  onMarketCandle(callback: (data: any) => void): void {
    this.socket?.on('market:candle', callback);
  }

  onBotUpdate(callback: (data: any) => void): void {
    this.socket?.on('bot:update', callback);
  }

  onNotification(callback: (data: any) => void): void {
    this.socket?.on('notification', callback);
  }

  offBalanceUpdate(): void {
    this.socket?.off('balance:update');
  }

  offTradeUpdate(): void {
    this.socket?.off('trade:update');
  }

  offTradeOpened(): void {
    this.socket?.off('trade:opened');
  }

  offTradeClosed(): void {
    this.socket?.off('trade:closed');
  }

  offTickUpdate(): void {
    this.socket?.off('tick:update');
  }

  offMarketTick(): void {
    this.socket?.off('market:tick');
  }

  offMarketCandle(): void {
    this.socket?.off('market:candle');
  }

  offBotUpdate(): void {
    this.socket?.off('bot:update');
  }

  offNotification(): void {
    this.socket?.off('notification');
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  onConnect(callback: () => void): void {
    this.socket?.on('connect', callback);
  }

  onDisconnect(callback: () => void): void {
    this.socket?.on('disconnect', callback);
  }

  offConnect(): void {
    this.socket?.off('connect');
  }

  offDisconnect(): void {
    this.socket?.off('disconnect');
  }
}

export const wsClient = new WebSocketClient();
