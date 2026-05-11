import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { riskManagerService } from '../services/riskManagerService.js';

export const getRiskSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) throw createError(401, 'Unauthorized');

    const settings = await riskManagerService.getOrCreateRiskSettings(req.userId);
    res.json({ riskSettings: settings });
  } catch (error: any) {
    logger.error('Failed to get risk settings:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateRiskSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) throw createError(401, 'Unauthorized');

    const settings = await riskManagerService.updateRiskSettings(req.userId, req.body);
    res.json({ message: 'Risk settings updated successfully', riskSettings: settings });
  } catch (error: any) {
    logger.error('Failed to update risk settings:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getRiskSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) throw createError(401, 'Unauthorized');

    const summary = await riskManagerService.getRiskSummary(req.userId);
    res.json({ summary });
  } catch (error: any) {
    logger.error('Failed to get risk summary:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const validateTradeRisk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) throw createError(401, 'Unauthorized');

    const { botId, accountId, stake, openTradesCount, dailyPnL, consecutiveLosses } = req.body;
    const result = await riskManagerService.validateTradeEntry({
      userId: req.userId,
      botId,
      accountId,
      stake,
      openTradesCount,
      dailyPnL,
      consecutiveLosses,
    });

    res.json({ riskCheck: result });
  } catch (error: any) {
    logger.error('Failed to validate trade risk:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};