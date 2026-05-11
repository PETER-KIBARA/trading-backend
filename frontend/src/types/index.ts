export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'premium_user' | 'admin';
  emailVerified: boolean;
  profileImage?: string;
}

export interface DerivAccount {
  id: string;
  accountId?: string;
  accountName: string;
  accountType: 'real' | 'demo';
  balance: number;
  currency: string;
  isDefault: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastSyncedAt?: string;
  settings?: Record<string, any>;
  createdAt: string;
}

export interface Bot {
  id: string;
  name: string;
  description?: string;
  strategyType: string;
  status: 'active' | 'inactive' | 'paused' | 'error';
  derivAccountId?: string;
  strategyConfig?: Record<string, any>;
  initialStake?: number;
  initialCapital?: number;
  currentCapital?: number;
  maxDailyLoss?: number;
  maxConsecutiveLoss?: number;
  maxOpenTrades?: number;
  consecutiveLosses?: number;
  totalProfit?: number;
  totalPnL?: number;
  winRate?: number;
  winTrades?: number;
  lossTrades?: number;
  totalTrades: number;
  isPaperTradingMode: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface Trade {
  id: string;
  contractId: string;
  marketType: string;
  contractType: string;
  stake: number;
  status: 'open' | 'closed' | 'won' | 'lost';
  profit?: number;
  pnl?: number;
  profitPercentage?: number;
  tradeType: 'manual' | 'bot' | 'ai_suggestion';
  derivAccountId?: string;
  botId?: string;
  symbol?: string;
  entryPrice?: number;
  exitPrice?: number;
  openTime: string;
  openedAt?: string;
  closeTime?: string;
  closedAt?: string;
}

export interface TradeStats {
  totalTrades: number;
  winCount: number;
  loseCount: number;
  winRate: number;
  totalProfit: number;
  averageProfitPerTrade: number;
  consecutiveLosses: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}
