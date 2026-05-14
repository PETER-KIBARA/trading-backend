import { AppDataSource } from '../config/database.js';
import { Bot } from '../models/Bot.js';
import { Trade } from '../models/Trade.js';
import { logger } from '../utils/logger.js';
import { createError } from '../utils/errors.js';
import { marketDataManager } from '../deriv/marketDataManager.js';
import { derivAuthService } from './derivAuthService.js';
import { tradeExecutorService } from './tradeExecutorService.js';
import { riskManagerService } from './riskManagerService.js';
import { StrategyEngine, CandleData, StrategySignal } from '../strategies/strategyEngine.js';

interface BotExecutionContext {
  botId: string;
  accountId: string;
  userId: string;
  lastCandles: CandleData[];
  lastSignal?: StrategySignal;
  consecutiveLosses: number;
  dailyPnL: number;
  openTradesCount: number;
  executionInterval?: NodeJS.Timeout;
}

/**
 * Bot Execution Service
 * Manages bot lifecycle, strategy execution, and trade management
 */
export class BotExecutorService {
  private botRepo = AppDataSource.getRepository(Bot);
  private tradeRepo = AppDataSource.getRepository(Trade);
  private executingBots = new Map<string, BotExecutionContext>();
  private readonly MIN_EXECUTION_INTERVAL = 5000; // 5 seconds minimum

  /**
   * Start bot execution
   */
  async startBotExecution(botId: string, userId: string): Promise<void> {
    try {
      // Check if already running
      if (this.executingBots.has(botId)) {
        throw createError(400, 'Bot is already running');
      }

      const bot = await this.botRepo.findOne({ where: { id: botId, userId } });
      if (!bot) {
        throw createError(404, 'Bot not found');
      }

      if (bot.status === 'active') {
        throw createError(400, 'Bot is already active');
      }

      if (!bot.derivAccountId || !bot.userId) {
        throw createError(400, 'Bot configuration incomplete - missing account or user ID');
      }

      // Initialize execution context
      const context: BotExecutionContext = {
        botId,
        accountId: bot.derivAccountId,
        userId: bot.userId,
        lastCandles: [],
        consecutiveLosses: 0,
        dailyPnL: 0,
        openTradesCount: 0,
      };

      // Verify account access
      await derivAuthService.getAccountInfo(bot.derivAccountId, bot.userId);

      // Start bot
      bot.status = 'active';
      bot.startTime = new Date();
      await this.botRepo.save(bot);

      // Schedule execution
      this.scheduleBotExecution(context, bot);

      // Store execution context
      this.executingBots.set(botId, context);

      logger.info(`Bot execution started`, { botId, userId, strategy: bot.strategyType });
    } catch (error) {
      logger.error(`Failed to start bot execution:`, error);
      throw error;
    }
  }

  /**
   * Stop bot execution
   */
  async stopBotExecution(botId: string, userId: string): Promise<void> {
    try {
      const context = this.executingBots.get(botId);

      if (!context) {
        throw createError(404, 'Bot is not running');
      }

      // Clear execution interval
      if (context.executionInterval) {
        clearInterval(context.executionInterval);
      }

      // Update bot status
      const bot = await this.botRepo.findOne({ where: { id: botId, userId } });
      if (bot) {
        bot.status = 'inactive';
        bot.endTime = new Date();
        await this.botRepo.save(bot);
      }

      // Remove from executing bots
      this.executingBots.delete(botId);

      logger.info(`Bot execution stopped`, { botId, userId });
    } catch (error) {
      logger.error(`Failed to stop bot execution:`, error);
      throw error;
    }
  }

  /**
   * Pause bot execution
   */
  async pauseBotExecution(botId: string, userId: string): Promise<void> {
    try {
      const context = this.executingBots.get(botId);

      if (!context) {
        throw createError(404, 'Bot is not running');
      }

      // Clear execution interval (pause)
      if (context.executionInterval) {
        clearInterval(context.executionInterval);
        context.executionInterval = undefined;
      }

      // Update bot status
      const bot = await this.botRepo.findOne({ where: { id: botId, userId } });
      if (bot) {
        bot.status = 'paused';
        await this.botRepo.save(bot);
      }

      logger.info(`Bot execution paused`, { botId, userId });
    } catch (error) {
      logger.error(`Failed to pause bot execution:`, error);
      throw error;
    }
  }

  /**
   * Resume bot execution
   */
  async resumeBotExecution(botId: string, userId: string): Promise<void> {
    try {
      const context = this.executingBots.get(botId);

      if (!context) {
        throw createError(404, 'Bot is not running');
      }

      const bot = await this.botRepo.findOne({ where: { id: botId, userId } });
      if (!bot) {
        throw createError(404, 'Bot not found');
      }

      // Resume execution
      bot.status = 'active';
      await this.botRepo.save(bot);

      // Reschedule execution
      this.scheduleBotExecution(context, bot);

      logger.info(`Bot execution resumed`, { botId, userId });
    } catch (error) {
      logger.error(`Failed to resume bot execution:`, error);
      throw error;
    }
  }

  /**
   * Check if bot is currently executing
   */
  isBotExecuting(botId: string): boolean {
    return this.executingBots.has(botId);
  }

  /**
   * Private methods
   */
  private scheduleBotExecution(context: BotExecutionContext, bot: Bot): void {
    const executionInterval = Math.max(
      bot.strategyConfig.executionInterval || 60000,
      this.MIN_EXECUTION_INTERVAL,
    );

    context.executionInterval = setInterval(async () => {
      try {
        await this.executeBotCycle(context, bot);
      } catch (error) {
        logger.error(`Bot execution cycle failed:`, error);
        // Continue execution despite error
      }
    }, executionInterval);

    logger.info(`Bot execution scheduled`, { botId: bot.id, interval: executionInterval });
  }

  private async executeBotCycle(context: BotExecutionContext, bot: Bot): Promise<void> {
    try {
      // Fetch latest candles
      const token = await derivAuthService.getDecryptedToken(context.accountId, context.userId);
      const symbol = bot.strategyConfig.symbol;
      const granularity = bot.strategyConfig.timeframe || 60;

      const candles = await marketDataManager.getHistoricalCandles(
        context.accountId,
        token,
        symbol,
        granularity,
        100,
      );

      if (candles.length === 0) {
        logger.warn(`No candle data available for bot execution`, { botId: bot.id, symbol });
        return;
      }

      context.lastCandles = candles;

      // Calculate strategy signal
      const signal = this.getStrategySignal(bot, candles);

      // Check risk management rules
      if (!(await this.passesRiskCheck(context, bot, signal))) {
        logger.debug(`Bot failed risk check`, { botId: bot.id, reason: 'Risk threshold exceeded' });
        return;
      }

      // Execute trade if signal is strong enough
      if (signal.action !== 'hold' && signal.confidence > 0.6) {
        await this.executeBotTrade(context, bot, signal);
      }

      context.lastSignal = signal;
    } catch (error) {
      logger.error(`Bot execution cycle error:`, error);
    }
  }

  private getStrategySignal(bot: Bot, candles: CandleData[]): StrategySignal {
    const strategy = bot.strategyType.toLowerCase();
    const config = bot.strategyConfig;

    switch (strategy) {
      case 'rsi':
        return this.getRSITradeSignal(candles, config);

      case 'macd':
        return this.getMACDTradeSignal(candles, config);

      case 'ma-crossover':
        return this.getMATradeSignal(candles, config);

      case 'bollinger-bands':
        return this.getBBTradeSignal(candles, config);

      case 'candlestick':
        return this.getCandlePatternSignal(candles);

      default:
        return { action: 'hold', strength: 0, confidence: 0, reason: 'Unknown strategy' };
    }
  }

  private getRSITradeSignal(candles: CandleData[], config: any): StrategySignal {
    const rsi = StrategyEngine.calculateRSI(candles, config.period || 14);
    return StrategyEngine.getRSISignal(
      rsi,
      config.oversoldThreshold || 30,
      config.overboughtThreshold || 70,
    );
  }

  private getMACDTradeSignal(candles: CandleData[], config: any): StrategySignal {
    const macdData = StrategyEngine.calculateMACD(
      candles,
      config.fastPeriod || 12,
      config.slowPeriod || 26,
      config.signalPeriod || 9,
    );
    return StrategyEngine.getMACDSignal(macdData);
  }

  private getMATradeSignal(candles: CandleData[], config: any): StrategySignal {
    const current = StrategyEngine.calculateMovingAverages(
      candles,
      config.fastPeriod || 10,
      config.slowPeriod || 20,
    );

    const previous = StrategyEngine.calculateMovingAverages(
      candles.slice(0, -1),
      config.fastPeriod || 10,
      config.slowPeriod || 20,
    );

    return StrategyEngine.getMASignal(current.fast, current.slow, previous.fast, previous.slow);
  }

  private getBBTradeSignal(candles: CandleData[], config: any): StrategySignal {
    const bb = StrategyEngine.calculateBollingerBands(candles, config.period || 20, config.stdDev || 2);
    const currentPrice = candles[candles.length - 1].close;
    return StrategyEngine.getBBSignal(currentPrice, bb.upper, bb.middle, bb.lower);
  }

  private getCandlePatternSignal(candles: CandleData[]): StrategySignal {
    const pattern = StrategyEngine.detectCandlePattern(candles);
    return StrategyEngine.getCandlePatternSignal(pattern);
  }

  private async passesRiskCheck(context: BotExecutionContext, bot: Bot, signal: StrategySignal): Promise<boolean> {
    const riskCheck = await riskManagerService.validateTradeEntry({
      userId: context.userId,
      botId: bot.id,
      accountId: context.accountId,
      stake: bot.initialStake * (signal.strength || 1),
      openTradesCount: context.openTradesCount,
      dailyPnL: context.dailyPnL,
      consecutiveLosses: context.consecutiveLosses,
    });

    if (!riskCheck.allowed) {
      logger.warn(`Bot stopped by risk manager`, { botId: bot.id, reason: riskCheck.reason });
      return false;
    }

    return true;
  }

  private async executeBotTrade(context: BotExecutionContext, bot: Bot, signal: StrategySignal): Promise<void> {
    try {
      const tradeRequest = {
        symbol: bot.strategyConfig.symbol,
        tradeType: signal.action === 'buy' ? 'rise' : 'fall',
        stake: bot.initialStake * (signal.strength || 1),
        duration: bot.strategyConfig.duration || 1,
        durationUnit: bot.strategyConfig.durationUnit || 'm' as const,
        contractType: bot.strategyConfig.contractType || 'digital' as const,
      };

      const trade = await tradeExecutorService.executeTrade(
        context.accountId,
        bot.id,
        bot.id,
        tradeRequest as any,
      );

      context.openTradesCount++;
      logger.info(`Bot trade executed`, { botId: bot.id, tradeId: trade.id, action: signal.action });
    } catch (error) {
      logger.error(`Bot trade execution failed:`, error);
    }
  }

  /**
   * Update bot statistics
   */
  async updateBotStats(botId: string): Promise<void> {
    try {
      const bot = await this.botRepo.findOne({ where: { id: botId } });
      if (!bot) return;

      const [trades] = await this.tradeRepo.findAndCount({
        where: { botId, status: 'closed' },
      });

      const winTrades = trades.filter((t) => (t.pnl || 0) > 0);
      const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

      bot.totalTrades = trades.length;
      bot.winTrades = winTrades.length;
      bot.lossTrades = trades.length - winTrades.length;
      bot.totalPnL = totalPnL;
      bot.currentCapital = (bot.initialCapital || 0) + totalPnL;

      await this.botRepo.save(bot);
    } catch (error) {
      logger.error(`Failed to update bot stats:`, error);
    }
  }
}

export const botExecutorService = new BotExecutorService();
