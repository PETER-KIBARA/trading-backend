import { Response } from 'express';
import { userService } from '../services/userService.js';
import { AuthRequest } from '../middleware/auth.js';
import { createError } from '../utils/errors.js';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw createError(400, 'Missing required fields');
    }

    const user = await userService.registerUser(email, password, firstName, lastName);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError(400, 'Email and password required');
    }

    const { user, accessToken, refreshToken } = await userService.loginUser(email, password);

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
  } catch (error: any) {
    res.status(error.statusCode || 401).json({ error: error.message });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw createError(400, 'Refresh token required');
    }

    const accessToken = await userService.refreshAccessToken(token);

    res.json({
      accessToken,
    });
  } catch (error: any) {
    res.status(error.statusCode || 401).json({ error: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw createError(400, 'Verification token required');
    }

    await userService.verifyEmail(token);

    res.json({
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

export const requestPasswordReset = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw createError(400, 'Email required');
    }

    await userService.requestPasswordReset(email);

    res.json({
      message: 'Password reset link sent to email',
    });
  } catch (error: any) {
    // Don't reveal if email exists
    res.json({
      message: 'If email exists, password reset link sent',
    });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw createError(400, 'Token and password required');
    }

    await userService.resetPassword(token, password);

    res.json({
      message: 'Password reset successful',
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      message: 'Logout successful',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
