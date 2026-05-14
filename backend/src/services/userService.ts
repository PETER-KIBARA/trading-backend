import bcryptjs from 'bcryptjs';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { authService } from '../utils/auth.js';
import { encryptionService } from '../utils/encryption.js';
import { createError } from '../utils/errors.js';

export class UserService {
  private getUserRepo() {
    console.log('[USER_SERVICE] getUserRepo() called');
    console.log('[USER_SERVICE] AppDataSource ID:', (AppDataSource as any).__ID);
    console.log('[USER_SERVICE] AppDataSource.isInitialized:', AppDataSource.isInitialized);
    
    if (!AppDataSource.isInitialized) {
      console.error('[USER_SERVICE] ERROR: AppDataSource is NOT initialized!');
      console.error('[USER_SERVICE] This means initializeDatabase() either:');
      console.error('[USER_SERVICE]   1. Was not called');
      console.error('[USER_SERVICE]   2. Failed silently');
      console.error('[USER_SERVICE]   3. Is a different module instance (ESM duplication)');
      console.error('[USER_SERVICE] AppDataSource instance ID:', (AppDataSource as any).__ID);
      throw new Error('Database not initialized');
    }
    console.log('[USER_SERVICE] Returning repository');
    return AppDataSource.getRepository(User);
  }

  async registerUser(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const userRepo = this.getUserRepo();
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw createError(409, 'Email already registered');
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = userRepo.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerificationToken: encryptionService.generateToken(),
    });

    return await userRepo.save(user);
  }

  async loginUser(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const userRepo = this.getUserRepo();
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      throw createError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw createError(403, 'Account is inactive');
    }

    user.lastLogin = new Date();
    await userRepo.save(user);

    const accessToken = authService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = authService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, accessToken, refreshToken };
  }

  async getUserById(userId: string): Promise<User> {
    const userRepo = this.getUserRepo();
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw createError(404, 'User not found');
    }
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUserById(userId);
    Object.assign(user, updates);
    const userRepo = this.getUserRepo();
    return await userRepo.save(user);
  }

  async verifyEmail(token: string): Promise<User> {
    const userRepo = this.getUserRepo();
    const user = await userRepo.findOne({ where: { emailVerificationToken: token } });
    if (!user) {
      throw createError(400, 'Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    return await userRepo.save(user);
  }

  async requestPasswordReset(email: string): Promise<string> {
    const userRepo = this.getUserRepo();
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      throw createError(404, 'User not found');
    }

    const resetToken = encryptionService.generateToken();
    user.passwordResetToken = await bcryptjs.hash(resetToken, 10);
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await userRepo.save(user);

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userRepo = this.getUserRepo();
    const users = await userRepo.find();
    let user: User | null = null;

    for (const u of users) {
      if (u.passwordResetToken && await bcryptjs.compare(token, u.passwordResetToken)) {
        if (u.passwordResetExpires && u.passwordResetExpires > new Date()) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw createError(400, 'Invalid or expired reset token');
    }

    user.password = await bcryptjs.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await userRepo.save(user);
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = authService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw createError(401, 'Invalid refresh token');
    }

    const user = await this.getUserById(payload.userId);
    return authService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }
}

export const userService = new UserService();
