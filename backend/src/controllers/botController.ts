import { Response } from 'express';
import { botService } from '../services/botService.js';
import { AuthRequest } from '../middleware/auth.js';
import { getWebSocketManager } from '../websocket/manager.js';
import { createError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new trading bot
 * POST /bots
 */
export const createBot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const {
      derivAccountId,
      name,
      strategyType,
      strategyConfig,
      initialStake,
      maxDailyLoss,
      maxConsecutiveLoss,
      maxOpenTrades,
    } = req.body;

    if (!derivAccountId || !name || !strategyType || !initialStake || !maxDailyLoss) {
      throw createError(400, 'Missing required fields');
    }

    if (!['rsi', 'macd', 'ma-crossover', 'bollinger-bands', 'candlestick'].includes(strategyType)) {
      throw createError(400, 'Invalid strategy type');
    }

    const bot = await botService.createBot(
      req.userId,
      derivAccountId,
      name,
      strategyType,
      strategyConfig || {},
      initialStake,
      maxDailyLoss,
      maxConsecutiveLoss,
      maxOpenTrades,
    );

    logger.info(`Bot created: ${bot.id} by user ${req.userId}`);

    res.status(201).json({
      message: 'Bot created successfully',
      bot: {
        id: bot.id,
        name: bot.name,
        strategyType: bot.strategyType,
        status: bot.status,
        initialStake: bot.initialStake,
        currentCapital: bot.currentCapital,
        maxDailyLoss: bot.maxDailyLoss,
        totalTrades: bot.totalTrades,
        createdAt: bot.createdAt,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to create bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get all bots for authenticated user
 * GET /bots
 */
export const getBots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const bots = await botService.getUserBots(req.userId);

    res.json({
      bots: bots.map((bot) => ({
        id: bot.id,
        name: bot.name,
        strategyType: bot.strategyType,
        status: bot.status,
        initialStake: bot.initialStake,
        currentCapital: bot.currentCapital,
        totalPnL: bot.totalPnL,
        totalTrades: bot.totalTrades,
        winTrades: bot.winTrades ?? 0,
        lossTrades: bot.lossTrades ?? 0,
        winRate: bot.totalTrades > 0 ? (((bot.winTrades ?? 0) / bot.totalTrades) * 100).toFixed(2) : 0,
        createdAt: bot.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error(`Failed to fetch bots:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get single bot by ID
 * GET /bots/:botId
 */
export const getBotById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    const bot = await botService.getBotById(botId, req.userId);

    res.json({
      bot: {
        id: bot.id,
        name: bot.name,
        strategyType: bot.strategyType,
        strategyConfig: bot.strategyConfig,
        status: bot.status,
        initialStake: bot.initialStake,
        initialCapital: bot.initialCapital,
        currentCapital: bot.currentCapital,
        maxDailyLoss: bot.maxDailyLoss,
        maxConsecutiveLoss: bot.maxConsecutiveLoss,
        maxOpenTrades: bot.maxOpenTrades,
        totalPnL: bot.totalPnL,
        totalTrades: bot.totalTrades,
        winTrades: bot.winTrades ?? 0,
        lossTrades: bot.lossTrades ?? 0,
        winRate: bot.totalTrades > 0 ? (((bot.winTrades ?? 0) / bot.totalTrades) * 100).toFixed(2) : 0,
        startTime: bot.startTime,
        endTime: bot.endTime,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to fetch bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Update bot configuration
 * PUT /bots/:botId
 */
export const updateBot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    const bot = await botService.getBotById(botId, req.userId);

    const { name, strategyConfig, maxDailyLoss, maxConsecutiveLoss, maxOpenTrades } = req.body;
    const updates: any = {};

    if (name) updates.name = name;
    if (strategyConfig) updates.strategyConfig = strategyConfig;
    if (maxDailyLoss) updates.maxDailyLoss = maxDailyLoss;
    if (maxConsecutiveLoss) updates.maxConsecutiveLoss = maxConsecutiveLoss;
    if (maxOpenTrades) updates.maxOpenTrades = maxOpenTrades;

    const updatedBot = await botService.updateBotConfig(botId, req.userId, updates);

    logger.info(`Bot updated: ${botId}`);

    res.json({
      message: 'Bot updated successfully',
      bot: {
        id: updatedBot.id,
        name: updatedBot.name,
        status: updatedBot.status,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to update bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Start bot execution
 * POST /bots/:botId/start
 */
export const startBot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    const bot = await botService.startBot(botId, req.userId);

    // Broadcast bot status change
    const wsManager = getWebSocketManager();
    wsManager.broadcastBotEvent(req.userId, botId, 'bot:started', { botId, status: 'active' });

    logger.info(`Bot started: ${botId} by user ${req.userId}`);

    res.json({
      message: 'Bot started successfully',
      bot: {
        id: bot.id,
        status: bot.status,
        startTime: bot.startTime,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to start bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Stop bot execution
 * POST /bots/:botId/stop
 */
export const stopBot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    const bot = await botService.stopBot(botId, req.userId);

    // Broadcast bot status change
    const wsManager = getWebSocketManager();
    wsManager.broadcastBotEvent(req.userId, botId, 'bot:stopped', { botId, status: 'inactive' });

    logger.info(`Bot stopped: ${botId} by user ${req.userId}`);

    res.json({
      message: 'Bot stopped successfully',
      bot: {
        id: bot.id,
        status: bot.status,
        endTime: bot.endTime,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to stop bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Pause bot execution (keeps resources allocated)
 * POST /bots/:botId/pause
 */
export const pauseBot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    const bot = await botService.pauseBot(botId, req.userId);

    // Broadcast bot status change
    const wsManager = getWebSocketManager();
    wsManager.broadcastBotEvent(req.userId, botId, 'bot:paused', { botId, status: 'paused' });

    logger.info(`Bot paused: ${botId} by user ${req.userId}`);

    res.json({
      message: 'Bot paused successfully',
      bot: {
        id: bot.id,
        status: bot.status,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to pause bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Resume bot execution
 * POST /bots/:botId/resume
 */
export const resumeBot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    const bot = await botService.resumeBot(botId, req.userId);

    // Broadcast bot status change
    const wsManager = getWebSocketManager();
    wsManager.broadcastBotEvent(req.userId, botId, 'bot:resumed', { botId, status: 'active' });

    logger.info(`Bot resumed: ${botId} by user ${req.userId}`);

    res.json({
      message: 'Bot resumed successfully',
      bot: {
        id: bot.id,
        status: bot.status,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to resume bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Duplicate bot configuration
 * POST /bots/:botId/duplicate
 */
export const duplicateBot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    const { newName } = req.body;

    if (!newName) {
      throw createError(400, 'Missing newName field');
    }

    const newBot = await botService.duplicateBot(botId, req.userId, newName);

    logger.info(`Bot duplicated: ${botId} -> ${newBot.id} by user ${req.userId}`);

    res.status(201).json({
      message: 'Bot duplicated successfully',
      bot: {
        id: newBot.id,
        name: newBot.name,
        status: newBot.status,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to duplicate bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get bot execution statistics
 * GET /bots/:botId/stats
 */
export const getBotStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    const bot = await botService.getBotById(botId, req.userId);

    // Update stats from tradeExecutorService
    const updatedBot = await botService.updateBotStats(botId);

    const lossTrades = updatedBot.lossTrades ?? 0;
    const totalPnL = updatedBot.totalPnL ?? 0;
    const initialCapital = updatedBot.initialCapital ?? 0;
    const profitFactor =
      lossTrades > 0 ? (totalPnL > 0 ? Math.abs(totalPnL) / (lossTrades * 50) : 0) : 0;

    res.json({
      stats: {
        botId: updatedBot.id,
        totalTrades: updatedBot.totalTrades,
        winTrades: updatedBot.winTrades ?? 0,
        lossTrades: lossTrades,
        winRate: updatedBot.totalTrades > 0 ? (((updatedBot.winTrades ?? 0) / updatedBot.totalTrades) * 100).toFixed(2) : 0,
        totalPnL: totalPnL,
        initialCapital: initialCapital,
        currentCapital: updatedBot.currentCapital,
        roi: initialCapital > 0 ? ((totalPnL / initialCapital) * 100).toFixed(2) : 0,
        profitFactor: profitFactor.toFixed(2),
        status: updatedBot.status,
        uptime:
          updatedBot.startTime && updatedBot.endTime
            ? ((updatedBot.endTime.getTime() - updatedBot.startTime.getTime()) / 1000 / 60).toFixed(2)
            : 'N/A',
      },
    });
  } catch (error: any) {
    logger.error(`Failed to fetch bot stats:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Delete bot
 * DELETE /bots/:botId
 */
export const deleteBot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { botId } = req.params;
    await botService.deleteBot(botId, req.userId);

    logger.info(`Bot deleted: ${botId} by user ${req.userId}`);

    res.json({
      message: 'Bot deleted successfully',
    });
  } catch (error: any) {
    logger.error(`Failed to delete bot:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
/**
 * Get available template bots
 * GET /bots/templates/available
 */
export const getAvailableTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = await botService.getTemplates();

    res.json({
      templates: templates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        strategyType: template.strategyType,
        strategyConfig: template.strategyConfig,
        marketType: template.marketType,
        initialStake: template.initialStake,
        maxDailyLoss: template.maxDailyLoss,
        maxConsecutiveLoss: template.maxConsecutiveLoss,
        maxOpenTrades: template.maxOpenTrades,
        isPaperTradingMode: template.isPaperTradingMode,
      })),
    });
  } catch (error: any) {
    logger.error(`Failed to fetch templates:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Activate a template bot for the user
 * POST /bots/templates/:templateId/activate
 * Body: { derivAccountId, name? }
 */
export const activateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { templateId } = req.params;
    const { derivAccountId, name } = req.body;

    if (!derivAccountId) {
      throw createError(400, 'Deriv account ID required');
    }

    const bot = await botService.activateTemplate(req.userId, templateId, derivAccountId, name);

    logger.info(`Template bot activated: ${bot.id} by user ${req.userId}`);

    res.status(201).json({
      message: 'Bot template activated successfully',
      bot: {
        id: bot.id,
        name: bot.name,
        strategyType: bot.strategyType,
        status: bot.status,
        initialStake: bot.initialStake,
        currentCapital: bot.currentCapital,
        maxDailyLoss: bot.maxDailyLoss,
        createdAt: bot.createdAt,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to activate template:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};