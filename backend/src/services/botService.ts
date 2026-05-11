import { AppDataSource } from '../config/database.js';
import { Bot } from '../models/Bot.js';
import { createError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { botExecutorService } from './botExecutorService.js';

export class BotService {
  private botRepo = AppDataSource.getRepository(Bot);

  /**
   * Create a new bot
   */
  async createBot(
    userId: string,
    derivAccountId: string,
    name: string,
    strategyType: string,
    strategyConfig: Record<string, any>,
    initialStake: number,
    maxDailyLoss?: number,
    maxConsecutiveLoss?: number,
    maxOpenTrades?: number,
  ): Promise<Bot> {
    const existingBot = await this.botRepo.findOne({ where: { name, userId } });
    if (existingBot) {
      throw createError(409, 'Bot with this name already exists');
    }

    // @ts-ignore - TypeORM strict type checking
    const bot = this.botRepo.create({
      userId,
      derivAccountId,
      name,
      strategyType: strategyType as any,
      strategyConfig,
      initialStake,
      initialCapital: initialStake,
      maxDailyLoss,
      maxConsecutiveLoss: maxConsecutiveLoss || (maxDailyLoss ? maxDailyLoss * 0.5 : 100),
      maxOpenTrades: maxOpenTrades || 5,
      status: 'inactive',
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      totalPnL: 0,
      currentCapital: initialStake,
    });

    return await this.botRepo.save(bot);
  }

  /**
   * Get bot by ID
   */
  async getBotById(botId: string, userId?: string): Promise<Bot> {
    const where: any = { id: botId };
    if (userId) {
      where.userId = userId;
    }

    const bot = await this.botRepo.findOne({ where });
    if (!bot) {
      throw createError(404, 'Bot not found');
    }
    return bot;
  }

  /**
   * Get all bots for a user
   */
  async getUserBots(userId: string): Promise<Bot[]> {
    return await this.botRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get active bots for scheduling
   */
  async getActiveBots(): Promise<Bot[]> {
    return await this.botRepo.find({
      where: { status: 'active' },
    });
  }

  /**
   * Start bot
   */
  async startBot(botId: string, userId: string): Promise<Bot> {
    const bot = await this.getBotById(botId, userId);

    if (bot.status === 'active') {
      throw createError(400, 'Bot is already running');
    }

    try {
      await botExecutorService.startBotExecution(botId, userId);
      bot.status = 'active';
      bot.startTime = new Date();
      return await this.botRepo.save(bot);
    } catch (error) {
      logger.error(`Failed to start bot:`, error);
      throw error;
    }
  }

  /**
   * Stop bot
   */
  async stopBot(botId: string, userId: string): Promise<Bot> {
    const bot = await this.getBotById(botId, userId);

    try {
      await botExecutorService.stopBotExecution(botId, userId);
      bot.status = 'inactive';
      bot.endTime = new Date();
      return await this.botRepo.save(bot);
    } catch (error) {
      logger.error(`Failed to stop bot:`, error);
      throw error;
    }
  }

  /**
   * Pause bot
   */
  async pauseBot(botId: string, userId: string): Promise<Bot> {
    const bot = await this.getBotById(botId, userId);

    try {
      await botExecutorService.pauseBotExecution(botId, userId);
      bot.status = 'paused';
      return await this.botRepo.save(bot);
    } catch (error) {
      logger.error(`Failed to pause bot:`, error);
      throw error;
    }
  }

  /**
   * Resume bot
   */
  async resumeBot(botId: string, userId: string): Promise<Bot> {
    const bot = await this.getBotById(botId, userId);

    try {
      await botExecutorService.resumeBotExecution(botId, userId);
      bot.status = 'active';
      return await this.botRepo.save(bot);
    } catch (error) {
      logger.error(`Failed to resume bot:`, error);
      throw error;
    }
  }

  /**
   * Duplicate bot
   */
  async duplicateBot(botId: string, userId: string, newName: string): Promise<Bot> {
    const originalBot = await this.getBotById(botId, userId);

    // @ts-ignore - TypeORM strict type checking
    const newBot = this.botRepo.create({
      userId,
      derivAccountId: originalBot.derivAccountId,
      name: newName,
      strategyType: originalBot.strategyType as any,
      strategyConfig: { ...originalBot.strategyConfig },
      initialStake: originalBot.initialStake,
      initialCapital: originalBot.initialStake,
      maxDailyLoss: originalBot.maxDailyLoss,
      maxConsecutiveLoss: originalBot.maxConsecutiveLoss,
      maxOpenTrades: originalBot.maxOpenTrades,
      status: 'inactive',
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      totalPnL: 0,
      currentCapital: originalBot.initialStake,
    });

    return await this.botRepo.save(newBot);
  }

  /**
   * Update bot configuration
   */
  async updateBotConfig(
    botId: string,
    userId: string,
    updates: Partial<Bot>,
  ): Promise<Bot> {
    const bot = await this.getBotById(botId, userId);

    // Check if bot is running (only allow certain updates)
    if (bot.status === 'active' && (updates.strategyConfig || updates.strategyType)) {
      throw createError(400, 'Cannot modify strategy configuration while bot is running');
    }

    Object.assign(bot, updates);
    return await this.botRepo.save(bot);
  }

  /**
   * Delete bot
   */
  async deleteBot(botId: string, userId: string): Promise<void> {
    const bot = await this.getBotById(botId, userId);

    if (bot.status === 'active') {
      throw createError(400, 'Cannot delete running bot. Stop it first.');
    }

    await this.botRepo.remove(bot);
  }

  /**
   * Update bot statistics
   */
  async updateBotStats(botId: string): Promise<Bot> {
    const bot = await this.botRepo.findOne({ where: { id: botId } });
    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    await botExecutorService.updateBotStats(botId);
    const updatedBot = await this.botRepo.findOne({ where: { id: botId } });
    if (!updatedBot) {
      throw createError(404, 'Bot not found after update');
    }
    return updatedBot;
  }
}

export const botService = new BotService();
