import { AppDataSource } from '../config/database.js';
import { Trade } from '../models/Trade.js';
import { DerivAccount } from '../models/DerivAccount.js';
import { createError } from '../utils/errors.js';

export class TradeService {
  private tradeRepo = AppDataSource.getRepository(Trade);
  private accountRepo = AppDataSource.getRepository(DerivAccount);

  async createTrade(
    derivAccountId: string,
    contractId: string,
    marketType: string,
    contractType: string,
    stake: number,
    tradeType: 'manual' | 'bot' | 'ai_suggestion',
  ): Promise<Trade> {
    // @ts-ignore - TypeORM strict type checking
    const trade = this.tradeRepo.create({
      derivAccountId,
      contractId,
      marketType: marketType as any,
      contractType,
      stake,
      tradeType: tradeType as any,
      status: 'open',
      openTime: new Date(),
    });

    return await this.tradeRepo.save(trade);
  }

  async closeTrade(tradeId: string, exitPrice: number, profit: number): Promise<Trade> {
    const trade = await this.tradeRepo.findOne({ where: { id: tradeId } });
    if (!trade) {
      throw createError(404, 'Trade not found');
    }

    trade.status = profit > 0 ? 'won' : 'lost';
    trade.exitPrice = exitPrice;
    trade.profit = profit;
    trade.profitPercentage = (profit / trade.stake) * 100;
    trade.closeTime = new Date();
    trade.durationMinutes = Math.floor((trade.closeTime.getTime() - trade.openTime.getTime()) / 60000);

    return await this.tradeRepo.save(trade);
  }

  async getAccountTrades(accountId: string, limit = 50, offset = 0): Promise<{ trades: Trade[]; total: number }> {
    const [trades, total] = await this.tradeRepo.findAndCount({
      where: { derivAccountId: accountId },
      order: { openTime: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { trades, total };
  }

  async getTradeStats(accountId: string): Promise<any> {
    const trades = await this.tradeRepo.find({
      where: { derivAccountId: accountId },
    });

    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winCount: 0,
        loseCount: 0,
        winRate: 0,
        totalProfit: 0,
        averageProfitPerTrade: 0,
        consecutiveLosses: 0,
      };
    }

    const closedTrades = trades.filter((t) => t.status === 'won' || t.status === 'lost');
    const wins = trades.filter((t) => t.status === 'won').length;
    const losses = trades.filter((t) => t.status === 'lost').length;
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);

    let consecutiveLosses = 0;
    for (let i = closedTrades.length - 1; i >= 0; i--) {
      if (closedTrades[i].status === 'lost') {
        consecutiveLosses++;
      } else {
        break;
      }
    }

    return {
      totalTrades: closedTrades.length,
      winCount: wins,
      loseCount: losses,
      winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
      totalProfit,
      averageProfitPerTrade: closedTrades.length > 0 ? totalProfit / closedTrades.length : 0,
      consecutiveLosses,
    };
  }
}

export const tradeService = new TradeService();
