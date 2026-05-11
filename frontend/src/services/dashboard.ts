import { apiClient } from './api';
import { DerivAccount, Bot, Trade, TradeStats } from '../types';

export interface RiskSummary {
  riskSettings: Record<string, any>;
  openTrades: number;
  tradesToday: number;
  dailyPnL: number;
  maxDailyLossReached: boolean;
  maxTradesReached: boolean;
}

export interface DashboardSnapshot {
  accounts: DerivAccount[];
  defaultAccount: DerivAccount | null;
  bots: Bot[];
  openTrades: Trade[];
  recentTrades: Trade[];
  tradeStats: TradeStats | null;
  riskSummary: RiskSummary | null;
}

export const dashboardService = {
  async loadSnapshot(): Promise<DashboardSnapshot> {
    const [accountsRes, defaultAccountRes, botsRes] = await Promise.all([
      apiClient.getAccounts(),
      apiClient.getDefaultAccount().catch(() => ({ data: { account: null } })),
      apiClient.getBots(),
    ]);

    const accounts = accountsRes.data.accounts as DerivAccount[];
    const defaultAccount = (defaultAccountRes as any).data.account as DerivAccount | null;
    const bots = botsRes.data.bots as Bot[];

    const activeAccount = defaultAccount ?? accounts[0] ?? null;

    if (!activeAccount) {
      return {
        accounts,
        defaultAccount,
        bots,
        openTrades: [],
        recentTrades: [],
        tradeStats: null,
        riskSummary: null,
      };
    }

    const [openTradesRes, recentTradesRes, statsRes, riskRes] = await Promise.all([
      apiClient.getOpenTrades(activeAccount.id),
      apiClient.getTradeHistory(activeAccount.id, 10, 0),
      apiClient.getTradeStats(activeAccount.id),
      apiClient.getRiskSummary().catch(() => ({ data: { summary: null } })),
    ]);

    return {
      accounts,
      defaultAccount,
      bots,
      openTrades: openTradesRes.data.trades as Trade[],
      recentTrades: recentTradesRes.data.trades as Trade[],
      tradeStats: statsRes.data as TradeStats,
      riskSummary: (riskRes as any).data.summary as RiskSummary | null,
    };
  },
};