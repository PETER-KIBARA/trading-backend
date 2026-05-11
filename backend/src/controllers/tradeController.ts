import { Response } from 'express';
import { tradeExecutorService } from '../services/tradeExecutorService.js';
import { realtimeStreamingService } from '../services/realtimeStreamingService.js';
import { accountService } from '../services/accountService.js';
import { AuthRequest } from '../middleware/auth.js';
import { getWebSocketManager } from '../websocket/manager.js';
import { createError } from '../utils/errors.js';

/**
 * Execute a new trade
 */
export const executeTrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId, botId, strategyId, ...tradeRequest } = req.body;

    if (!accountId || !tradeRequest.symbol || tradeRequest.stake === undefined) {
      throw createError(400, 'Missing required fields: accountId, symbol, stake');
    }

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    const trade = await tradeExecutorService.executeTrade(
      accountId,
      botId || 'manual',
      strategyId || 'manual',
      tradeRequest,
    );

    // Broadcast trade update via WebSocket
    const wsManager = getWebSocketManager();
    wsManager.sendToUser(req.userId, 'trade:opened', {
      trade: {
        id: trade.id,
        contractId: trade.contractId,
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        stake: trade.stake,
        entryPrice: trade.entryPrice,
        status: trade.status,
        openedAt: trade.openedAt,
      },
    });

    res.status(201).json({
      message: 'Trade executed successfully',
      trade: {
        id: trade.id,
        contractId: trade.contractId,
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        stake: trade.stake,
        entryPrice: trade.entryPrice,
        status: trade.status,
        openedAt: trade.openedAt,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Close an open trade
 */
export const closeTrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { tradeId } = req.params;
    const { accountId } = req.body;

    // Verify account belongs to user if provided
    if (accountId) {
      await accountService.getAccountByIdAndUser(accountId, req.userId);
    }

    const trade = await tradeExecutorService.closeTrade(tradeId, accountId);

    // Broadcast trade closed via WebSocket
    const wsManager = getWebSocketManager();
    wsManager.sendToUser(req.userId, 'trade:closed', {
      trade: {
        id: trade.id,
        contractId: trade.contractId,
        symbol: trade.symbol,
        pnl: trade.pnl,
        exitPrice: trade.exitPrice,
        status: trade.status,
        closedAt: trade.closedAt,
      },
    });

    res.json({
      message: 'Trade closed successfully',
      trade: {
        id: trade.id,
        contractId: trade.contractId,
        symbol: trade.symbol,
        pnl: trade.pnl,
        exitPrice: trade.exitPrice,
        status: trade.status,
        closedAt: trade.closedAt,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get open trades
 */
export const getOpenTrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    const trades = await tradeExecutorService.getOpenTrades(accountId);

    res.json({
      trades: trades.map((trade) => ({
        id: trade.id,
        contractId: trade.contractId,
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        stake: trade.stake,
        entryPrice: trade.entryPrice,
        status: trade.status,
        openedAt: trade.openedAt,
      })),
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get trade history
 */
export const getTradeHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const symbol = req.query.symbol as string | undefined;

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    const { trades, total } = await tradeExecutorService.getTradeHistory(
      accountId,
      limit,
      offset,
      symbol,
    );

    res.json({
      trades: trades.map((trade) => ({
        id: trade.id,
        contractId: trade.contractId,
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        stake: trade.stake,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        pnl: trade.pnl,
        status: trade.status,
        openedAt: trade.openedAt,
        closedAt: trade.closedAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get trade statistics
 */
export const getTradeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    const stats = await tradeExecutorService.getTradeStats(accountId, startDate, endDate);

    res.json(stats);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Subscribe to market ticks
 */
export const subscribeToTicks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId, symbol } = req.body;

    if (!accountId || !symbol) {
      throw createError(400, 'Missing required fields: accountId, symbol');
    }

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    const subscriptionId = await realtimeStreamingService.subscribeToTicks(
      req.userId,
      accountId,
      symbol,
    );

    res.json({
      message: 'Subscribed to ticks',
      subscriptionId,
      symbol,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

/**
 * Get available market symbols
 */
export const getSymbols = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      throw createError(401, 'Unauthorized');
    }

    const { accountId } = req.params;

    // Verify account belongs to user
    await accountService.getAccountByIdAndUser(accountId, req.userId);

    const symbols = await realtimeStreamingService.getAvailableSymbols(req.userId, accountId);

    res.json({
      symbols: symbols.map((sym: any) => ({
        symbol: sym.symbol,
        displayName: sym.display_name,
        description: sym.description,
        submarket: sym.submarket,
        market: sym.market,
      })),
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
