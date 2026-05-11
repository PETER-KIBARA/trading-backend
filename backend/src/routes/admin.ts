import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Bot } from '../models/Bot.js';
import { Trade } from '../models/Trade.js';
import { Subscription } from '../models/Subscription.js';
import { AnalyticsLog } from '../models/AnalyticsLog.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User);
  const botRepo = AppDataSource.getRepository(Bot);
  const tradeRepo = AppDataSource.getRepository(Trade);
  const subRepo = AppDataSource.getRepository(Subscription);
  const logRepo = AppDataSource.getRepository(AnalyticsLog);

  const [users, bots, trades, subscriptions, logs] = await Promise.all([
    userRepo.count(),
    botRepo.count(),
    tradeRepo.count(),
    subRepo.count(),
    logRepo.count(),
  ]);

  res.json({ users, bots, trades, subscriptions, logs });
}));

router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const users = await AppDataSource.getRepository(User).find({ order: { createdAt: 'DESC' } });
  res.json({ users });
}));

router.get('/logs', asyncHandler(async (req: Request, res: Response) => {
  const logs = await AppDataSource.getRepository(AnalyticsLog).find({ order: { createdAt: 'DESC' }, take: 100 });
  res.json({ logs });
}));

router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
    websocket: 'running',
  });
}));

export default router;
