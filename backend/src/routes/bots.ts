import { Router } from 'express';
import * as botController from '../controllers/botController.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * Bot Management Routes
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /bots - Create new bot
 * Body: { derivAccountId, name, strategyType, strategyConfig, initialStake, maxDailyLoss, maxConsecutiveLoss?, maxOpenTrades? }
 */
router.post('/', asyncHandler(botController.createBot));

/**
 * GET /bots/templates/available - List available template bots
 */
router.get('/templates/available', asyncHandler(botController.getAvailableTemplates));

/**
 * POST /bots/templates/:templateId/activate - Activate template for user
 * Body: { derivAccountId, name? }
 */
router.post('/templates/:templateId/activate', asyncHandler(botController.activateTemplate));

/**
 * GET /bots - List all user's bots
 */
router.get('/', asyncHandler(botController.getBots));

/**
 * GET /bots/:botId - Get bot details
 */
router.get('/:botId', asyncHandler(botController.getBotById));

/**
 * GET /bots/:botId/stats - Get bot execution statistics
 */
router.get('/:botId/stats', asyncHandler(botController.getBotStats));

/**
 * PUT /bots/:botId - Update bot configuration
 * Body: { name?, strategyConfig?, maxDailyLoss?, maxConsecutiveLoss?, maxOpenTrades? }
 */
router.put('/:botId', asyncHandler(botController.updateBot));

/**
 * POST /bots/:botId/start - Start bot execution
 */
router.post('/:botId/start', asyncHandler(botController.startBot));

/**
 * POST /bots/:botId/stop - Stop bot execution
 */
router.post('/:botId/stop', asyncHandler(botController.stopBot));

/**
 * POST /bots/:botId/pause - Pause bot execution
 */
router.post('/:botId/pause', asyncHandler(botController.pauseBot));

/**
 * POST /bots/:botId/resume - Resume bot execution
 */
router.post('/:botId/resume', asyncHandler(botController.resumeBot));

/**
 * POST /bots/:botId/duplicate - Duplicate bot with new name
 * Body: { newName }
 */
router.post('/:botId/duplicate', asyncHandler(botController.duplicateBot));

/**
 * DELETE /bots/:botId - Delete bot
 */
router.delete('/:botId', asyncHandler(botController.deleteBot));

export default router;
