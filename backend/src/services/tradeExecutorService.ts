import { AppDataSource } from '../config/database.js';
import { Trade } from '../models/Trade.js';
import { createError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { marketDataManager } from '../deriv/marketDataManager.js';
import { derivAuthService } from './derivAuthService.js';
import { riskManagerService } from './riskManagerService.js';
import { Bot } from '../models/Bot.js';

interface TradeRequest {
  symbol: string;
  tradeType: 'rise' | 'fall' | 'high' | 'low' | 'matches' | 'differs' | 'even' | 'odd';
  stake: number;
  duration: number;
  durationUnit: 'm' | 'h' | 'd';
  barrier?: number; // For barrier trades
  barrierOffset?: number; // For range trades
  contractType: 'multiplier' | 'digital' | 'touch' | 'runs' | 'endsinout' | 'stays_in_out';
  marketType: 'volatility' | 'boom_crash' | 'forex' | 'synthetic';
}

/**
 * Service for executing trades and managing trade lifecycle
 */
export class TradeExecutorService {
  private tradeRepo = AppDataSource.getRepository(Trade);
  private botRepo = AppDataSource.getRepository(Bot);

  /**
   * Execute a trade on Deriv
   */
  async executeTrade(
    accountId: string,
    botId: string,
    strategyId: string,
    tradeRequest: TradeRequest,
  ): Promise<Trade> {
    try {
      const bot = await this.botRepo.findOne({ where: { id: botId } });
      if (!bot) {
        throw createError(404, 'Bot not found');
      }

      if (!bot.userId) {
        throw createError(400, 'Bot user ID missing');
      }

      const riskCheck = await riskManagerService.validateTradeEntry({
        userId: bot.userId,
        botId,
        accountId,
        stake: tradeRequest.stake,
      });

      if (!riskCheck.allowed) {
        throw createError(400, riskCheck.reason || 'Risk limits prevent this trade');
      }

      // Get account and decrypted token
      await derivAuthService.getAccountInfo(accountId);
      const token = await derivAuthService.getDecryptedToken(accountId);

      // Prepare trade payload
      const payload = this.buildTradePayload(tradeRequest);

      // Execute trade via Deriv API
      const response = await marketDataManager.placeTrade(accountId, token, payload);

      if (response.error) {
        throw createError(400, `Deriv trade error: ${response.error.message}`);
      }

      if (!response.buy) {
        throw createError(400, 'No buy response from Deriv');
      }

      const buyResponse = response.buy;

      // Save trade to database
      // @ts-ignore - TypeORM strict type checking
      const trade = this.tradeRepo.create({
        derivAccountId: accountId,
        botId,
        contractId: buyResponse.contract_id,
        symbol: tradeRequest.symbol,
        tradeType: tradeRequest.tradeType as any,
        stake: tradeRequest.stake,
        marketType: tradeRequest.marketType as any,
        contractType: tradeRequest.contractType || 'call',
        entryPrice: buyResponse.ask_price,
        status: 'open',
        derivResponse: buyResponse,
        openedAt: new Date(),
      });

      await this.tradeRepo.save(trade);

      logger.info(`Trade executed: ${trade.id}`, {
        accountId,
        botId,
        contractId: trade.contractId,
        stake: trade.stake,
      });

      return trade;
    } catch (error: any) {
      logger.error(`Trade execution failed:`, error);
      throw error;
    }
  }

  /**
   * Close/sell an open trade
   */
  async closeTrade(tradeId: string, accountId?: string): Promise<Trade> {
    const trade = await this.tradeRepo.findOne({ where: { id: tradeId } });

    if (!trade) {
      throw createError(404, 'Trade not found');
    }

    if (accountId && trade.derivAccountId !== accountId) {
      throw createError(403, 'Unauthorized');
    }

    if (trade.status !== 'open') {
      throw createError(400, `Cannot close trade with status: ${trade.status}`);
    }

    try {
      // Get token and close trade via Deriv
      const token = await derivAuthService.getDecryptedToken(trade.derivAccountId);

      const response = await marketDataManager.closeTrade(trade.derivAccountId, token, trade.contractId);

      if (response.error) {
        throw createError(400, `Deriv close error: ${response.error.message}`);
      }

      // Update trade status
      trade.status = 'closed';
      trade.closedAt = new Date();
      trade.exitPrice = response.sell?.ask_price || 0;
      trade.pnl = this.calculatePnL(trade.entryPrice || 0, trade.exitPrice || 0, trade.stake);
      trade.derivResponse = response;

      await this.tradeRepo.save(trade);

      logger.info(`Trade closed: ${trade.id}`, {
        contractId: trade.contractId,
        pnl: trade.pnl,
      });

      return trade;
    } catch (error: any) {
      logger.error(`Failed to close trade:`, error);
      throw error;
    }
  }

  /**
   * Get open trades for account
   */
  async getOpenTrades(accountId: string): Promise<Trade[]> {
    return await this.tradeRepo.find({
      where: { derivAccountId: accountId, status: 'open' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get trade history
   */
  async getTradeHistory(
    accountId: string,
    limit: number = 50,
    offset: number = 0,
    symbol?: string,
  ): Promise<{ trades: Trade[]; total: number }> {
    const where: any = { derivAccountId: accountId };
    if (symbol) {
      where.symbol = symbol;
    }

    const [trades, total] = await this.tradeRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { trades, total };
  }

  /**
   * Get trade statistics
   */
  async getTradeStats(accountId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = { derivAccountId: accountId, status: 'closed' };

    if (startDate || endDate) {
      where.closedAt = {};
      if (startDate) where.closedAt.gte = startDate;
      if (endDate) where.closedAt.lte = endDate;
    }

    const trades = await this.tradeRepo.find({ where });

    if (trades.length === 0) {
      return {
        totalTrades: 0,
        totalStake: 0,
        totalPnL: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
      };
    }

    const winTrades = trades.filter((t) => (t.pnl || 0) > 0);
    const lossTrades = trades.filter((t) => (t.pnl || 0) < 0);

    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalStake = trades.reduce((sum, t) => sum + t.stake, 0);
    const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winTrades.length : 0;
    const avgLoss =
      lossTrades.length > 0 ? lossTrades.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / lossTrades.length : 0;

    const largestWin = Math.max(...winTrades.map((t) => t.pnl || 0), 0);
    const largestLoss = Math.min(...lossTrades.map((t) => t.pnl || 0), 0);

    const grossProfit = winTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(lossTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));

    return {
      totalTrades: trades.length,
      totalStake,
      totalPnL,
      winCount: winTrades.length,
      lossCount: lossTrades.length,
      winRate: (winTrades.length / trades.length) * 100,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss: Math.abs(largestLoss),
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      roi: totalStake > 0 ? (totalPnL / totalStake) * 100 : 0,
    };
  }

  /**
   * Build Deriv API trade payload
   */
  private buildTradePayload(tradeRequest: TradeRequest): Record<string, any> {
    const payload: Record<string, any> = {
      buy: 1,
      price: tradeRequest.stake,
      parameters: {
        amount: tradeRequest.stake,
        basis: 'stake',
        contract_type: this.mapContractType(tradeRequest.tradeType),
        currency: 'USD',
        duration: tradeRequest.duration,
        duration_unit: tradeRequest.durationUnit,
        symbol: tradeRequest.symbol,
      },
    };

    // Add barrier for relevant contract types
    if (tradeRequest.barrier !== undefined) {
      payload.parameters.barrier = tradeRequest.barrier;
    }

    if (tradeRequest.barrierOffset !== undefined) {
      payload.parameters.barrier_offset = tradeRequest.barrierOffset;
    }

    return payload;
  }

  /**
   * Map trading strategy type to Deriv contract type
   */
  private mapContractType(tradeType: string): string {
    const mapping: Record<string, string> = {
      rise: 'CALL',
      fall: 'PUT',
      high: 'ASIANU',
      low: 'ASIAND',
      matches: 'DIGITMATCH',
      differs: 'DIGITDIFF',
      even: 'DIGITEVEN',
      odd: 'DIGITODD',
    };

    return mapping[tradeType] || 'CALL';
  }

  /**
   * Calculate PnL
   */
  private calculatePnL(entryPrice: number, exitPrice: number, stake: number): number {
    const pnl = exitPrice - entryPrice;
    return pnl > 0 ? exitPrice - entryPrice : -(stake + Math.abs(pnl));
  }
}

export const tradeExecutorService = new TradeExecutorService();
