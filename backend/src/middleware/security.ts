import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { ENV } from '../config/env.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});

export const tradeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit to 30 trades per minute
  message: 'Too many trades, please try again later.',
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedFromEnv = (ENV.CLIENT_URL || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      ...allowedFromEnv,
    ];

    // Allow requests with no origin (Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow exact matches or common localhost patterns
    if (
      allowedOrigins.includes(origin) ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      /^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin)
    ) {
      return callback(null, true);
    }

    console.warn(`CORS: Rejected origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
});
