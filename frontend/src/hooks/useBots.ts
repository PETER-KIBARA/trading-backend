import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { wsClient } from '../services/websocket';
import { hasDerivConnection } from '../services/derivAuth';

export interface Bot {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'inactive' | 'stopped';
  strategy: string;
  trades: number;
  pnl: number;
  monthlyPnL?: number;
  winRate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BotTemplate {
  id?: string;
  name: string;
  strategy: string;
  description?: string;
  badge?: string;
}

export interface BotsData {
  bots: Bot[];
  templates: BotTemplate[];
  activeBotCount: number;
  monthlyPnL: number;
  riskEvents: number;
  loading: boolean;
  error: string | null;
  isDerivConnected: boolean;
}

const DEFAULT_TEMPLATES: BotTemplate[] = [
  { name: 'RSI Pulse', strategy: 'RSI', badge: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' },
  { name: 'MACD Flow', strategy: 'MACD', badge: 'border-violet-400/20 bg-violet-400/10 text-violet-200' },
  { name: 'Trend Guard', strategy: 'MA Crossover', badge: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' },
];

export const useBots = (): BotsData => {
  const [data, setData] = useState<BotsData>({
    bots: [],
    templates: DEFAULT_TEMPLATES,
    activeBotCount: 0,
    monthlyPnL: 0,
    riskEvents: 0,
    loading: true,
    error: null,
    isDerivConnected: hasDerivConnection(),
  });

  useEffect(() => {
    const loadBotsData = async () => {
      const isDerivConnected = hasDerivConnection();

      if (!isDerivConnected) {
        setData({
          bots: [],
          templates: DEFAULT_TEMPLATES,
          activeBotCount: 0,
          monthlyPnL: 0,
          riskEvents: 0,
          loading: false,
          error: null,
          isDerivConnected: false,
        });
        return;
      }

      try {
        setData((prev) => ({ ...prev, loading: true, error: null, isDerivConnected: true }));

        const [botsResponse, statsResponse] = await Promise.all([
          apiClient.getBots(),
          apiClient.getRiskSummary(),
        ]);

        const responseData = botsResponse.data as Bot[] | { bots?: Bot[] };
        const bots: Bot[] = Array.isArray(responseData)
          ? responseData
          : (responseData.bots ?? []);
        const stats = statsResponse.data as { riskEventCount?: number };

        const activeBotCount = bots.filter((bot) => bot.status === 'active').length;
        const monthlyPnL = bots.reduce(
          (sum: number, bot: Bot) => sum + (bot.monthlyPnL ?? 0),
          0,
        );
        const riskEvents = stats.riskEventCount ?? 0;

        setData({
          bots,
          templates: DEFAULT_TEMPLATES,
          activeBotCount,
          monthlyPnL,
          riskEvents,
          loading: false,
          error: null,
          isDerivConnected: true,
        });

        wsClient.onBotStatusChange?.((botData: Partial<Bot> & { id: string }) => {
          setData((prev) => ({
            ...prev,
            bots: prev.bots.map((bot) =>
              bot.id === botData.id ? { ...bot, ...botData } : bot,
            ),
          }));
        });

        wsClient.onBotPnLUpdate?.((botData: { id: string; pnl: number }) => {
          setData((prev) => ({
            ...prev,
            bots: prev.bots.map((bot) =>
              bot.id === botData.id ? { ...bot, pnl: botData.pnl } : bot,
            ),
            monthlyPnL: prev.bots.reduce(
              (sum: number, bot: Bot) =>
                sum + (bot.id === botData.id ? botData.pnl : bot.pnl),
              0,
            ),
          }));
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load bots data';
        setData((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          isDerivConnected: true,
        }));
      }
    };

    void loadBotsData();
  }, []);

  return data;
};
