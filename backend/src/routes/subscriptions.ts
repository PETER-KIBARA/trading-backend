import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppDataSource } from '../config/database.js';
import { Subscription } from '../models/Subscription.js';

const router = Router();

router.use(authMiddleware);

router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    plans: [
      { id: 'free', name: 'Free', price: 0, maxBots: 1, maxAccounts: 1 },
      { id: 'premium', name: 'Premium', price: 29.99, maxBots: 10, maxAccounts: 5 },
      { id: 'pro', name: 'Pro', price: 79.99, maxBots: 50, maxAccounts: 20 },
    ],
  });
}));

router.get('/current', asyncHandler(async (req: AuthRequest, res: Response) => {
  const subRepo = AppDataSource.getRepository(Subscription);
  const subscription = await subRepo.findOne({ where: { userId: req.userId }, order: { createdAt: 'DESC' } });
  res.json({ subscription });
}));

router.post('/checkout/stripe', asyncHandler(async (req: Request, res: Response) => {
  res.json({ message: 'Stripe checkout session placeholder' });
}));

router.post('/checkout/mpesa', asyncHandler(async (req: Request, res: Response) => {
  res.json({ message: 'Mpesa payment request placeholder' });
}));

router.post('/cancel', asyncHandler(async (req: Request, res: Response) => {
  res.json({ message: 'Subscription cancelled' });
}));

export default router;
