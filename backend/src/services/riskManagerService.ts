import { AppDataSource } from '../config/database.js';
import { RiskSettings } from '../models/RiskSettings.js';
import { Trade } from '../models/Trade.js';
import { Bot } from '../models/Bot.js';
import { createError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { In } from 'typeorm';

export interface RiskEvaluationInput {
  userId: string;
  botId?: string;
  accountId?: string;
  stake?: number;
  openTradesCount?: number;
  dailyPnL?: number;
  consecutiveLosses?: number;
}

export interface RiskEvaluationResult {
  allowed: boolean;
  reason?: string;
  riskSettings: RiskSettings;
  dailyPnL: number;
  openTradesCount: number;
  tradesToday: number;
  consecutiveLosses: number;
}

const DEFAULT_RISK_SETTINGS: Partial<RiskSettings> = {
  maxDailyLoss: 100,
  maxConsecutiveLosses: 5,
  maxStake: 25,
  minStake: 1,
  stopLossPercentage: 5,
  takeProfitPercentage: 10,
  maxTradesPerDay: 20,
  sessionTimeoutMinutes: 240,
  maxDrawdownPercentage: 20,
  enableStopLoss: true,
  enableTakeProfit: true,
  customRules: {},
};

/**
 * Centralized risk evaluation and enforcement.
 */
export class RiskManagerService {
  private riskRepo = AppDataSource.getRepository(RiskSettings);
  private tradeRepo = AppDataSource.getRepository(Trade);
  private botRepo = AppDataSource.getRepository(Bot);

  async getOrCreateRiskSettings(userId: string): Promise<RiskSettings> {
    let settings = await this.riskRepo.findOne({ where: { userId } });

    if (!settings) {
      const created = {
        userId,
        ...(DEFAULT_RISK_SETTINGS as any),
      } as any;
      settings = (await this.riskRepo.save(created as any)) as RiskSettings;
    }

    return settings as RiskSettings;
  }

  async updateRiskSettings(userId: string, updates: Partial<RiskSettings>): Promise<RiskSettings> {
    const current = await this.getOrCreateRiskSettings(userId);
    Object.assign(current, updates);
    return await this.riskRepo.save(current);
  }

  async getRiskSummary(userId: string): Promise<Record<string, any>> {
    const riskSettings = await this.getOrCreateRiskSettings(userId);
    const bots = await this.botRepo.find({ where: { userId } });
    const botIds = bots.map((bot) => bot.id);
    const todayStart = this.getStartOfDay();

    if (botIds.length === 0) {
      return {
        riskSettings,
        openTrades: 0,
        tradesToday: 0,
        dailyPnL: 0,
        maxDailyLossReached: false,
        maxTradesReached: false,
      };
    }

    const dailyTrades = await this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.botId IN (:...botIds)', { botIds })
      .andWhere('trade.createdAt >= :todayStart', { todayStart })
      .getMany();

    const openTrades = await this.tradeRepo.count({
      where: { botId: In(botIds), status: 'open' } as any,
    });

    const closedTradesToday = dailyTrades.filter((trade) => trade.status === 'closed');
    const dailyPnL = closedTradesToday.reduce((sum, trade) => sum + Number((trade as any).pnl || trade.profit || 0), 0);

    return {
      riskSettings,
      openTrades,
      tradesToday: dailyTrades.length,
      dailyPnL,
      maxDailyLossReached: dailyPnL <= -Number(riskSettings.maxDailyLoss || 0),
      maxTradesReached: dailyTrades.length >= Number(riskSettings.maxTradesPerDay || 0),
    };
  }

  async validateTradeEntry(input: RiskEvaluationInput): Promise<RiskEvaluationResult> {
    const [riskSettings, bot] = await Promise.all([
      this.getOrCreateRiskSettings(input.userId),
      input.botId ? this.botRepo.findOne({ where: { id: input.botId, userId: input.userId } }) : Promise.resolve(null),
    ]);

    if (input.botId && !bot) {
      throw createError(404, 'Bot not found');
    }

    const stake = Number(input.stake ?? bot?.initialStake ?? 0);
    const minStake = Number(riskSettings.minStake || 0);
    const maxStake = Number(riskSettings.maxStake || Number.MAX_SAFE_INTEGER);

    if (stake < minStake) {
      return this.rejected(riskSettings, input, `Stake below minimum allowed stake of ${minStake}`);
    }

    if (stake > maxStake) {
      return this.rejected(riskSettings, input, `Stake above maximum allowed stake of ${maxStake}`);
    }

    const summary = await this.getRiskSummary(input.userId);
    const openTradesCount = input.openTradesCount ?? summary.openTrades;
    const dailyPnL = input.dailyPnL ?? summary.dailyPnL;
    const consecutiveLosses = input.consecutiveLosses ?? Number(bot?.consecutiveLosses || 0);

    if (dailyPnL <= -Number(riskSettings.maxDailyLoss || 0)) {
      return this.rejected(riskSettings, input, 'Maximum daily loss reached');
    }

    if (consecutiveLosses >= Number(riskSettings.maxConsecutiveLosses || 0)) {
      return this.rejected(riskSettings, input, 'Maximum consecutive losses reached');
    }

    if (openTradesCount >= Number(riskSettings.maxTradesPerDay || 0)) {
      return this.rejected(riskSettings, input, 'Maximum open trades reached');
    }

    return {
      allowed: true,
      riskSettings,
      dailyPnL,
      openTradesCount,
      tradesToday: summary.tradesToday,
      consecutiveLosses,
    };
  }

  async enforceMaxDrawdown(userId: string, botId?: string): Promise<RiskEvaluationResult> {
    const bot = botId ? await this.botRepo.findOne({ where: { id: botId, userId } }) : null;
    const riskSettings = await this.getOrCreateRiskSettings(userId);
    const summary = await this.getRiskSummary(userId);

    const currentCapital = Number(bot?.currentCapital || 0);
    const initialCapital = Number(bot?.initialCapital || 0);
    const drawdown = initialCapital > 0 ? ((initialCapital - currentCapital) / initialCapital) * 100 : 0;

    if (drawdown >= Number(riskSettings.maxDrawdownPercentage || 0)) {
      return {
        allowed: false,
        reason: 'Maximum drawdown exceeded',
        riskSettings,
        dailyPnL: summary.dailyPnL,
        openTradesCount: summary.openTrades,
        tradesToday: summary.tradesToday,
        consecutiveLosses: Number(bot?.consecutiveLosses || 0),
      };
    }

    return {
      allowed: true,
      riskSettings,
      dailyPnL: summary.dailyPnL,
      openTradesCount: summary.openTrades,
      tradesToday: summary.tradesToday,
      consecutiveLosses: Number(bot?.consecutiveLosses || 0),
    };
  }

  async enforceStopLoss(tradeId: string): Promise<{ triggered: boolean; reason?: string; threshold?: number }> {
    const trade = await this.tradeRepo.findOne({ where: { id: tradeId } });
    if (!trade) {
      throw createError(404, 'Trade not found');
    }

    const bot = trade.botId ? await this.botRepo.findOne({ where: { id: trade.botId } }) : null;
    const userId = bot?.userId;
    if (!userId) {
      return { triggered: false };
    }

    const settings = await this.getOrCreateRiskSettings(userId);
    const pnl = Number((trade as any).pnl || trade.profit || 0);
    const stake = Number(trade.stake || 0);
    const threshold = -Math.abs(stake * (Number(settings.stopLossPercentage || 0) / 100));

    if (!settings.enableStopLoss || pnl > threshold) {
      return { triggered: false, threshold };
    }

    logger.warn(`Stop loss triggered for trade ${tradeId}`);
    return { triggered: true, reason: 'Stop loss threshold reached', threshold };
  }

  async enforceTakeProfit(tradeId: string): Promise<{ triggered: boolean; reason?: string; threshold?: number }> {
    const trade = await this.tradeRepo.findOne({ where: { id: tradeId } });
    if (!trade) {
      throw createError(404, 'Trade not found');
    }

    const bot = trade.botId ? await this.botRepo.findOne({ where: { id: trade.botId } }) : null;
    const userId = bot?.userId;
    if (!userId) {
      return { triggered: false };
    }

    const settings = await this.getOrCreateRiskSettings(userId);
    const pnl = Number((trade as any).pnl || trade.profit || 0);
    const stake = Number(trade.stake || 0);
    const threshold = Math.abs(stake * (Number(settings.takeProfitPercentage || 0) / 100));

    if (!settings.enableTakeProfit || pnl < threshold) {
      return { triggered: false, threshold };
    }

    logger.info(`Take profit triggered for trade ${tradeId}`);
    return { triggered: true, reason: 'Take profit threshold reached', threshold };
  }

  async getBotConsecutiveLosses(botId: string): Promise<number> {
    const bot = await this.botRepo.findOne({ where: { id: botId } });
    return Number(bot?.consecutiveLosses || 0);
  }

  private rejected(
    riskSettings: RiskSettings,
    input: RiskEvaluationInput,
    reason: string,
  ): RiskEvaluationResult {
    return {
      allowed: false,
      reason,
      riskSettings,
      dailyPnL: input.dailyPnL ?? 0,
      openTradesCount: input.openTradesCount ?? 0,
      tradesToday: 0,
      consecutiveLosses: input.consecutiveLosses ?? 0,
    };
  }

  private getStartOfDay(): Date {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }
}

export const riskManagerService = new RiskManagerService();