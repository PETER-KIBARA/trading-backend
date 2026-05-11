import { Router } from 'express';
import * as tradeController from '../controllers/tradeController.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Trade execution
router.post('/', asyncHandler(tradeController.executeTrade));
router.post('/:tradeId/close', asyncHandler(tradeController.closeTrade));

// Trade history and statistics
router.get('/:accountId/open', asyncHandler(tradeController.getOpenTrades));
router.get('/:accountId/history', asyncHandler(tradeController.getTradeHistory));
router.get('/:accountId/stats', asyncHandler(tradeController.getTradeStats));

// Market data streaming
router.post('/:accountId/subscribe-ticks', asyncHandler(tradeController.subscribeToTicks));
router.get('/:accountId/symbols', asyncHandler(tradeController.getSymbols));

export default router;
