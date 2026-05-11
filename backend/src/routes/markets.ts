import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(authMiddleware);

router.get('/tickers', asyncHandler(async (req: Request, res: Response) => {
  res.json({ tickers: [] });
}));

router.get('/watchlist', asyncHandler(async (req: Request, res: Response) => {
  res.json({ watchlist: [] });
}));

router.post('/watchlist', asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ message: 'Added to watchlist' });
}));

router.delete('/watchlist/:symbol', asyncHandler(async (req: Request, res: Response) => {
  res.json({ message: 'Removed from watchlist' });
}));

export default router;
