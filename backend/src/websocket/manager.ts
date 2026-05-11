import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

export class WebSocketManager {
  private io: SocketIOServer;
  private userSockets = new Map<string, Socket[]>();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: ENV.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.io.use((socket, next) => {
      const userId = socket.handshake.query.userId as string;
      if (!userId) {
        return next(new Error('Authentication failed'));
      }
      socket.data.userId = userId;
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      logger.info(`User connected: ${userId}`, { socketId: socket.id });

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${userId}`, { socketId: socket.id });
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          const index = sockets.indexOf(socket);
          if (index > -1) {
            sockets.splice(index, 1);
          }
          if (sockets.length === 0) {
            this.userSockets.delete(userId);
          }
        }
      });

      // Subscribe to account updates
      socket.on('subscribe:account', (accountId: string) => {
        socket.join(`account:${accountId}`);
        logger.debug(`User subscribed to account updates`, { userId, accountId });
      });

      // Unsubscribe from account updates
      socket.on('unsubscribe:account', (accountId: string) => {
        socket.leave(`account:${accountId}`);
        logger.debug(`User unsubscribed from account updates`, { userId, accountId });
      });

      // Subscribe to trade updates
      socket.on('subscribe:trades', (accountId: string) => {
        socket.join(`trades:${accountId}`);
        logger.debug(`User subscribed to trade updates`, { userId, accountId });
      });

      // Subscribe to market data
      socket.on('market:subscribe-ticks', (data: { accountId: string; symbol: string }) => {
        socket.join(`market:ticks:${data.accountId}:${data.symbol}`);
        logger.debug(`User subscribed to market ticks`, { userId, ...data });
      });

      // Unsubscribe from market data
      socket.on('market:unsubscribe-ticks', (data: { accountId: string; symbol: string }) => {
        socket.leave(`market:ticks:${data.accountId}:${data.symbol}`);
        logger.debug(`User unsubscribed from market ticks`, { userId, ...data });
      });

      // Subscribe to candles
      socket.on('market:subscribe-candles', (data: { accountId: string; symbol: string; granularity: number }) => {
        socket.join(`market:candles:${data.accountId}:${data.symbol}:${data.granularity}`);
        logger.debug(`User subscribed to market candles`, { userId, ...data });
      });

      // Unsubscribe from candles
      socket.on('market:unsubscribe-candles', (data: { accountId: string; symbol: string; granularity: number }) => {
        socket.leave(`market:candles:${data.accountId}:${data.symbol}:${data.granularity}`);
        logger.debug(`User unsubscribed from market candles`, { userId, ...data });
      });
    });
  }

  // Send message to specific user
  sendToUser(userId: string, event: string, data: any): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socket) => {
        socket.emit(event, data);
      });
    }
  }

  // Broadcast to account room
  broadcastToAccount(accountId: string, event: string, data: any): void {
    this.io.to(`account:${accountId}`).emit(event, data);
  }

  // Broadcast trade update
  broadcastTradeUpdate(accountId: string, trade: any): void {
    this.io.to(`trades:${accountId}`).emit('trade:update', trade);
  }

  // Broadcast balance update
  broadcastBalanceUpdate(userId: string, accountId: string, balance: number): void {
    this.io.to(`account:${accountId}`).emit('balance:update', { accountId, balance, updatedAt: new Date() });
  }

  // Broadcast tick update
  broadcastTickUpdate(accountId: string, tick: any): void {
    this.io.to(`account:${accountId}`).emit('tick:update', tick);
  }

  // Broadcast bot update
  broadcastBotUpdate(botId: string, status: string, data: any): void {
    this.io.to(`bot:${botId}`).emit('bot:update', { status, data });
  }

  // Broadcast bot event to user
  broadcastBotEvent(userId: string, botId: string, eventType: string, data: any): void {
    this.sendToUser(userId, eventType, { botId, ...data });
  }

  // Broadcast notification
  broadcastNotification(userId: string, notification: any): void {
    this.sendToUser(userId, 'notification', notification);
  }

  // Broadcast market tick update
  broadcastMarketTickUpdate(accountId: string, symbol: string, tick: any): void {
    this.io.to(`market:ticks:${accountId}:${symbol}`).emit('market:tick', tick);
  }

  // Broadcast candle update
  broadcastCandleUpdate(accountId: string, symbol: string, granularity: number, candle: any): void {
    this.io.to(`market:candles:${accountId}:${symbol}:${granularity}`).emit('market:candle', candle);
  }

  // Broadcast trade opened
  broadcastTradeOpened(userId: string, trade: any): void {
    this.sendToUser(userId, 'trade:opened', trade);
  }

  // Broadcast trade closed
  broadcastTradeClosed(userId: string, trade: any): void {
    this.sendToUser(userId, 'trade:closed', trade);
  }

  getIO(): SocketIOServer {
    return this.io;
  }

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }
}

let wsManager: WebSocketManager;

export const initializeWebSocketManager = (httpServer: HTTPServer): WebSocketManager => {
  wsManager = new WebSocketManager(httpServer);
  return wsManager;
};

export const getWebSocketManager = (): WebSocketManager => {
  if (!wsManager) {
    throw new Error('WebSocket manager not initialized');
  }
  return wsManager;
};
