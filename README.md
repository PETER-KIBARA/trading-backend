# TradeAI Platform

Enterprise-grade AI-powered trading platform built with React, TypeScript, Node.js, Express, PostgreSQL, and WebSockets, integrating with the official Deriv API.

## Features
- Deriv account login with secure token encryption
- Multi-account support with demo/real switching
- Real-time trading dashboard
- WebSocket market data and trade updates
- Bot automation framework
- Risk management controls
- Admin analytics and monitoring
- Subscription-ready architecture
- Telegram notification integration
- Dockerized deployment

## Stack
- Frontend: React, TypeScript, TailwindCSS, Vite
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL via TypeORM
- Real-time: Socket.IO + Deriv WebSocket API
- Security: Helmet, rate limiting, JWT, encryption

## Project Structure
- backend/ - API server
- frontend/ - Web app
- database/ - SQL schema and migrations
- .docker/ - container definitions

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Deriv app ID from https://developers.deriv.com/

### Backend
1. Copy backend/.env.example to backend/.env
2. Configure DB and Deriv credentials
3. Install dependencies:
   - npm install in backend
4. Start dev server:
   - npm run dev

### Frontend
1. Install dependencies:
   - npm install in frontend
2. Start dev server:
   - npm run dev

### Database
- Run database/schema.sql in PostgreSQL

### Docker
- docker compose up --build

## API Overview
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- POST /api/accounts
- GET /api/accounts
- GET /api/trades/:accountId/trades
- POST /api/bots
- GET /api/admin/dashboard
- GET /api/subscriptions/plans
- GET /api/analytics/overview

## Security Notes
- Store Deriv tokens encrypted at rest
- Use HTTPS and secure cookies in production
- Set strong JWT and encryption secrets
- Enable CSRF protections for browser-based mutations

## Production Notes
- Replace scaffold placeholders in bot execution and subscription payment flows with live providers.
- Add rate-limited background workers for market polling and strategy execution.
- Use a managed secret store in production.
