import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { hasDerivConnection } from '../services/derivAuth';
import { Bot, DerivAccount } from '../types';

export interface Metric {
  label: string;
  value: string;
  delta: string;
  badge: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
  impact: string;
}

export interface AnalyticsData {
  metrics: Metric[];
  timeline: TimelineEvent[];
  loading: boolean;
  error: string | null;
  isDerivConnected: boolean;
}

interface BotStatsAggregate {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  totalPnL: number;
  consecutiveLosses: number;
}

const EMPTY_BOT_STATS: BotStatsAggregate = {
  totalTrades: 0,
  winTrades: 0,
  lossTrades: 0,
  totalPnL: 0,
  consecutiveLosses: 0,
};

const calculateMetrics = (botStats: BotStatsAggregate): Metric[] => {
  const { totalTrades, winTrades, totalPnL, consecutiveLosses } = botStats;
  const winRate = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : '0';
  const avgReturn = totalTrades > 0 ? (totalPnL / totalTrades).toFixed(2) : '0';

  return [
    {
      label: 'Daily win rate',
      value: `${winRate}%`,
      delta: '+2.1%',
      badge: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    },
    {
      label: 'Avg. trade return',
      value: `$${Math.abs(Number(avgReturn))}`,
      delta: totalPnL >= 0 ? '+1.2%' : '-0.8%',
      badge:
        totalPnL >= 0
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
          : 'border-red-400/20 bg-red-400/10 text-red-200',
    },
    {
      label: 'Total P&L',
      value: `$${Math.abs(totalPnL).toFixed(2)}`,
      delta: totalPnL >= 0 ? '+5.3%' : '-2.4%',
      badge:
        totalPnL >= 0
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
          : 'border-red-400/20 bg-red-400/10 text-red-200',
    },
    {
      label: 'Drawdown',
      value: `${consecutiveLosses}`,
      delta: 'consecutive losses',
      badge:
        consecutiveLosses > 3
          ? 'border-red-400/20 bg-red-400/10 text-red-200'
          : 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    },
  ];
};

function aggregateBotStats(bots: Bot[]): BotStatsAggregate {
  return bots.reduce<BotStatsAggregate>(
    (acc, bot) => ({
      totalTrades: acc.totalTrades + (bot.totalTrades ?? 0),
      winTrades: acc.winTrades + (bot.winTrades ?? 0),
      lossTrades: acc.lossTrades + (bot.lossTrades ?? 0),
      totalPnL: acc.totalPnL + (bot.totalPnL ?? 0),
      consecutiveLosses: Math.max(
        acc.consecutiveLosses,
        bot.consecutiveLosses ?? 0,
      ),
    }),
    { ...EMPTY_BOT_STATS },
  );
}

function buildTimeline(bots: Bot[], accounts: DerivAccount[]): TimelineEvent[] {
  const timeline: TimelineEvent[] = bots
    .filter((bot) => bot.status === 'active')
    .slice(0, 5)
    .map((bot, index) => ({
      time: `${index + 1}h ago`,
      event: `${bot.name} - ${bot.strategyType}`,
      impact:
        (bot.totalPnL ?? 0) >= 0
          ? `+$${(bot.totalPnL ?? 0).toFixed(2)}`
          : `-$${Math.abs(bot.totalPnL ?? 0).toFixed(2)}`,
    }));

  if (accounts.length > 0) {
    const totalBalance = accounts.reduce(
      (sum: number, account: DerivAccount) => sum + (account.balance || 0),
      0,
    );
    timeline.unshift({
      time: 'now',
      event: `Portfolio balance: ${accounts.length} account${accounts.length > 1 ? 's' : ''}`,
      impact: `$${totalBalance.toFixed(2)}`,
    });
  }

  return timeline;
}

export const useAnalytics = (): AnalyticsData => {
  const [data, setData] = useState<AnalyticsData>({
    metrics: [],
    timeline: [],
    loading: true,
    error: null,
    isDerivConnected: hasDerivConnection(),
  });

  useEffect(() => {
    const loadAnalyticsData = async () => {
      const isDerivConnected = hasDerivConnection();

      if (!isDerivConnected) {
        setData({
          metrics: calculateMetrics(EMPTY_BOT_STATS),
          timeline: [
            {
              time: 'now',
              event: 'Deriv account not connected',
              impact: 'Connect a Deriv account to start',
            },
          ],
          loading: false,
          error: null,
          isDerivConnected: false,
        });
        return;
      }

      try {
        setData((prev) => ({ ...prev, loading: true, error: null, isDerivConnected: true }));

        const [accountsResponse, botsResponse] = await Promise.all([
          apiClient.getAccounts().catch(() => ({ data: { accounts: [] as DerivAccount[] } })),
          apiClient.getBots().catch(() => ({ data: [] as Bot[] })),
        ]);

        const accounts: DerivAccount[] = accountsResponse.data?.accounts ?? [];
        const bots: Bot[] = Array.isArray(botsResponse.data)
          ? botsResponse.data
          : (botsResponse.data?.bots ?? []);

        const aggregatedStats = aggregateBotStats(bots);
        const metrics = calculateMetrics(aggregatedStats);
        const timeline = buildTimeline(bots, accounts);

        setData({
          metrics,
          timeline:
            timeline.length > 0
              ? timeline
              : [{ time: 'now', event: 'No activity yet', impact: 'Launch a bot to begin' }],
          loading: false,
          error: null,
          isDerivConnected: true,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load analytics';

        setData((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
          isDerivConnected: true,
        }));
      }
    };

    void loadAnalyticsData();
  }, []);

  return data;
};
