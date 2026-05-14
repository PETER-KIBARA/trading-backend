import express, { Express, Request, Response } from 'express';
import http from 'http';
import { AppDataSource } from './config/database.js';
import { User } from './models/User.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, apiLimiter, corsMiddleware } from './middleware/security.js';
import { initializeWebSocketManager } from './websocket/manager.js';

// Import routes
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import tradeRoutes from './routes/trades.js';
import botRoutes from './routes/bots.js';
import adminRoutes from './routes/admin.js';
import subscriptionRoutes from './routes/subscriptions.js';
import analyticsRoutes from './routes/analytics.js';
import marketRoutes from './routes/markets.js';
import riskRoutes from './routes/risk.js';

export async function createApp(): Promise<{ app: Express; server: http.Server }> {
  const app = express();
  // When running behind a proxy (e.g., Render), trust the first proxy
  // so `req.ip` and rate-limiters use the client's real IP.
  app.set('trust proxy', 1);
  const server = http.createServer(app);

  // Initialize WebSocket Manager
  initializeWebSocketManager(server);

  // Security middleware
  app.use(securityHeaders);
  app.use(corsMiddleware);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Rate limiting
  app.use('/api/', apiLimiter);

  // Health check endpoint
  // Root quick-check (helps when visiting service root in browser)
  app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Backend is alive and reachable' });
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/trades', tradeRoutes);
  app.use('/api/bots', botRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/markets', marketRoutes);
  app.use('/api/risk', riskRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.path,
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return { app, server };
}

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[INIT] Starting database initialization...');
    console.log('[INIT] AppDataSource.isInitialized:', AppDataSource.isInitialized);
    
    if (!AppDataSource.isInitialized) {
      logger.info('Initializing database connection...', {
        type: 'postgres',
        host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
        hasUrl: !!process.env.DATABASE_URL,
      });

      console.log('[INIT] Calling AppDataSource.initialize()...');
      await AppDataSource.initialize();
      console.log('[INIT] AppDataSource.initialize() completed');
      console.log('[INIT] AppDataSource.isInitialized is now:', AppDataSource.isInitialized);
      
      logger.info('Database connection established and initialized');
    } else {
      console.log('[INIT] Database already initialized, skipping...');
    }
  } catch (error: any) {
    console.error('[INIT] CRITICAL ERROR during database initialization:', error);
    logger.error('Database connection error', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function startServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.listen(ENV.PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
      resolve();
    });

    server.on('error', (error: any) => {
      logger.error('Server error', error);
      reject(error);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Graceful shutdown initiated');
      server.close(async () => {
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
        }
        process.exit(0);
      });
    });
  });
}
