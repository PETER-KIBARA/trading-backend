import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.post('/register', authLimiter, asyncHandler(authController.register));
router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/refresh-token', asyncHandler(authController.refreshToken));
router.post('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/request-password-reset', asyncHandler(authController.requestPasswordReset));
router.post('/reset-password', asyncHandler(authController.resetPassword));

// Protected routes
router.get('/profile', authMiddleware, asyncHandler(authController.getProfile));
router.put('/profile', authMiddleware, asyncHandler(authController.updateProfile));
router.post('/logout', authMiddleware, asyncHandler(authController.logout));

export default router;
