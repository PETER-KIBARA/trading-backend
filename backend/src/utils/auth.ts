import jwt, { SignOptions } from 'jsonwebtoken';
import { ENV } from '../config/env.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  generateAccessToken(payload: TokenPayload): string {
    // @ts-ignore - expiresIn can be a string like "7d"
    return jwt.sign(payload, ENV.JWT.SECRET as string, {
      expiresIn: ENV.JWT.EXPIRY,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    // @ts-ignore - expiresIn can be a string like "30d"
    return jwt.sign(payload, ENV.JWT.REFRESH_SECRET as string, {
      expiresIn: ENV.JWT.REFRESH_EXPIRY,
    });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, ENV.JWT.SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, ENV.JWT.REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}

export const authService = new AuthService();
