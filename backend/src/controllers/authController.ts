import { Response } from 'express';
import { userService } from '../services/userService.js';
import { AuthRequest } from '../middleware/auth.js';
import { createError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    throw createError(400, 'Missing required fields: email, password, firstName, lastName');
  }

  if (password.length < 8) {
    throw createError(400, 'Password must be at least 8 characters');
  }

  const user = await userService.registerUser(email, password, firstName, lastName);

  logger.info('User registered successfully', { userId: user.id, email: user.email });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await userService.loginUser(email, password);

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  });
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw createError(400, 'Refresh token required');
  }

  const accessToken = await userService.refreshAccessToken(token);

  res.json({
    accessToken,
  });
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError(401, 'Unauthorized');
  }

  const user = await userService.getUserById(req.user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerified,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    },
  });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError(401, 'Unauthorized');
  }

  const { firstName, lastName, phone, profileImage } = req.body;
  const updates: any = {};

  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (phone) updates.phone = phone;
  if (profileImage) updates.profileImage = profileImage;

  const user = await userService.updateUser(req.user.id, updates);

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    },
  });
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    throw createError(400, 'Verification token required');
  }

  await userService.verifyEmail(token);

  res.json({
    message: 'Email verified successfully',
  });
};

export const requestPasswordReset = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw createError(400, 'Email required');
  }

  await userService.requestPasswordReset(email);

  // Don't reveal if email exists for security
  res.json({
    message: 'If email exists, password reset link sent',
  });
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw createError(400, 'Token and password required');
  }

  await userService.resetPassword(token, password);

  res.json({
    message: 'Password reset successful',
  });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    message: 'Logout successful',
  });
};
};
