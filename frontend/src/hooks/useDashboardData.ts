import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardSnapshot } from '../services/dashboard';
import { wsClient } from '../services/websocket';
import { Trade } from '../types';

export interface DashboardData {
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  accountBalance: number;
  dailyPnL: number;
  winRate: number;
  activeBots: number;
  recentTrades: Trade[];
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    snapshot: null,
    loading: true,
    error: null,
    accountBalance: 0,
    dailyPnL: 0,
    winRate: 0,
    activeBots: 0,
    recentTrades: [],
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));
      const snapshot = await dashboardService.loadSnapshot();

      const accountBalance = snapshot.defaultAccount?.balance ?? 0;
      const activeBots = snapshot.bots.filter((b) => b.status === 'active').length;
      const winRate = snapshot.tradeStats?.winRate ?? 0;
      const dailyPnL = snapshot.riskSummary?.dailyPnL ?? 0;

      setData({
        snapshot,
        loading: false,
        error: null,
        accountBalance,
        dailyPnL,
        winRate,
        activeBots,
        recentTrades: snapshot.recentTrades,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setData((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  useEffect(() => {
    // Load initial data
    loadDashboardData();

    // Set up WebSocket listeners
    if (!data.snapshot?.defaultAccount) {
      return;
    }

    const accountId = data.snapshot.defaultAccount.id;

    // Listen for balance updates
    wsClient.onBalanceUpdate((balanceData) => {
      setData((prev) => ({
        ...prev,
        accountBalance: balanceData.balance,
        snapshot: prev.snapshot
          ? {
              ...prev.snapshot,
              defaultAccount: prev.snapshot.defaultAccount
                ? { ...prev.snapshot.defaultAccount, balance: balanceData.balance }
                : null,
            }
          : null,
      }));
    });

    // Listen for new trades
    wsClient.onTradeOpened((tradeData) => {
      setData((prev) => ({
        ...prev,
        recentTrades: [tradeData, ...(prev.recentTrades || [])].slice(0, 10),
      }));
    });

    // Listen for closed trades
    wsClient.onTradeClosed((tradeData) => {
      setData((prev) => {
        const updatedTrades = prev.recentTrades?.map((t) =>
          t.id === tradeData.id ? { ...t, ...tradeData } : t,
        );
        return {
          ...prev,
          recentTrades: updatedTrades || [],
        };
      });
    });

    // Listen for bot updates
    wsClient.onBotUpdate((botData) => {
      setData((prev) => ({
        ...prev,
        snapshot: prev.snapshot
          ? {
              ...prev.snapshot,
              bots: prev.snapshot.bots.map((b) => (b.id === botData.id ? { ...b, ...botData } : b)),
            }
          : null,
        activeBots: prev.snapshot?.bots.filter((b) => b.status === 'active').length ?? 0,
      }));
    });

    // Subscribe to account events
    wsClient.subscribeToAccount(accountId);
    wsClient.subscribeToTrades(accountId);

    // Cleanup listeners on unmount
    return () => {
      wsClient.unsubscribeFromAccount(accountId);
      wsClient.offBalanceUpdate();
      wsClient.offTradeOpened();
      wsClient.offTradeClosed();
      wsClient.offBotUpdate();
    };
  }, [loadDashboardData, data.snapshot?.defaultAccount?.id]);

  return data;
};
