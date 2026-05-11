import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as riskController from '../controllers/riskController.js';

const router = Router();

router.use(authMiddleware);

router.get('/settings', asyncHandler(riskController.getRiskSettings));
router.put('/settings', asyncHandler(riskController.updateRiskSettings));
router.get('/summary', asyncHandler(riskController.getRiskSummary));
router.post('/validate-trade', asyncHandler(riskController.validateTradeRisk));

export default router;