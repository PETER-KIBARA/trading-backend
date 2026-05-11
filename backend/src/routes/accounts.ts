import { Router } from 'express';
import * as accountController from '../controllers/accountController.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Account management
router.post('/', asyncHandler(accountController.addAccount));
router.get('/', asyncHandler(accountController.getAccounts));
router.get('/default', asyncHandler(accountController.getDefaultAccount));
router.get('/:accountId', asyncHandler(accountController.getAccountById));

// Deriv integration
router.post('/:accountId/sync-balance', asyncHandler(accountController.syncBalance));
router.post('/sync', asyncHandler(accountController.syncAllBalances));

// Account settings
router.put('/:accountId/settings', asyncHandler(accountController.updateSettings));
router.post('/:accountId/set-default', asyncHandler(accountController.setDefault));
router.delete('/:accountId', asyncHandler(accountController.deleteAccount));

export default router;
