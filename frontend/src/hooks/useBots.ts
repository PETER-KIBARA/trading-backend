import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { wsClient } from '../services/websocket';

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
}

export const useBots = () => {
  const [data, setData] = useState<BotsData>({
    bots: [],
    templates: [],
    activeBotCount: 0,
    monthlyPnL: 0,
    riskEvents: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadBotsData = async () => {
      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        const [botsResponse, statsResponse] = await Promise.all([
          apiClient.getBots(),
          apiClient.getRiskSummary(),
        ]);

        const bots = botsResponse.data || [];
        const stats = statsResponse.data || {};

        // Calculate stats
        const activeBotCount = bots.filter((b: Bot) => b.status === 'active').length;
        const monthlyPnL = bots.reduce((sum: number, bot: Bot) => sum + (bot.monthlyPnL || 0), 0);
        const riskEvents = stats.riskEventCount || 0;

        // Prepare templates (these can be fetched from backend later)
        const templates: BotTemplate[] = [
          { name: 'RSI Pulse', strategy: 'RSI', badge: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' },
          { name: 'MACD Flow', strategy: 'MACD', badge: 'border-violet-400/20 bg-violet-400/10 text-violet-200' },
          { name: 'Trend Guard', strategy: 'MA Crossover', badge: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' },
        ];

        setData({
          bots,
          templates,
          activeBotCount,
          monthlyPnL,
          riskEvents,
          loading: false,
          error: null,
        });

        // Set up WebSocket listeners for real-time updates
        wsClient.onBotStatusChange?.((botData) => {
          setData((prev) => ({
            ...prev,
            bots: prev.bots.map((b) => (b.id === botData.id ? { ...b, ...botData } : b)),
          }));
        });

        wsClient.onBotPnLUpdate?.((botData) => {
          setData((prev) => ({
            ...prev,
            bots: prev.bots.map((b) => (b.id === botData.id ? { ...b, pnl: botData.pnl } : b)),
            monthlyPnL: prev.bots.reduce((sum, b) => sum + (b.id === botData.id ? botData.pnl : b.pnl), 0),
          }));
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load bots data';
        setData((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    };

    loadBotsData();
  }, []);

  return data;
};
