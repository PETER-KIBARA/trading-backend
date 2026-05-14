import { Request, Response, NextFunction } from 'express';
import { authService } from '../utils/auth.js';
import { createError } from '../utils/errors.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
  token?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      logger.warn('Auth: No token provided', { 
        path: req.path,
        authHeader: authHeader ? 'present' : 'missing'
      });
      throw createError(401, 'No token provided');
    }

    const payload = authService.verifyAccessToken(token);
    if (!payload) {
      logger.warn('Auth: Token verification failed', { path: req.path });
      throw createError(401, 'Invalid or expired token');
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.userId } });

    if (!user) {
      logger.warn('Auth: User not found', { userId: payload.userId });
      throw createError(401, 'User not found');
    }

    req.user = user;
    req.userId = user.id;
    req.token = token;
    next();
  } catch (error: any) {
    logger.error('Auth middleware error', { 
      message: error.message,
      path: req.path
    });
    res.status(error.statusCode || 401).json({
      error: error.message || 'Unauthorized',
    });
  }
};

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      throw createError(403, 'Admin access required');
    }
    next();
  } catch (error: any) {
    res.status(error.statusCode || 403).json({
      error: error.message || 'Forbidden',
    });
  }
};

export const premiumMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!['admin', 'premium_user'].includes(req.user?.role || '')) {
      throw createError(403, 'Premium access required');
    }
    next();
  } catch (error: any) {
    res.status(error.statusCode || 403).json({
      error: error.message || 'Forbidden',
    });
  }
};
