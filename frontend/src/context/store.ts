import { create } from 'zustand';
import { User, DerivAccount, Bot, Trade, TradeStats, Notification } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

interface AccountState {
  accounts: DerivAccount[];
  selectedAccount: DerivAccount | null;
  setAccounts: (accounts: DerivAccount[]) => void;
  setSelectedAccount: (account: DerivAccount | null) => void;
  updateAccount: (account: DerivAccount) => void;
}

interface BotState {
  bots: Bot[];
  selectedBot: Bot | null;
  setBots: (bots: Bot[]) => void;
  setSelectedBot: (bot: Bot | null) => void;
}

interface TradeState {
  trades: Trade[];
  stats: TradeStats | null;
  setTrades: (trades: Trade[]) => void;
  setStats: (stats: TradeStats | null) => void;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  selectedAccount: null,
  setAccounts: (accounts) => set({ accounts }),
  setSelectedAccount: (selectedAccount) => set({ selectedAccount }),
  updateAccount: (account) =>
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
      selectedAccount: state.selectedAccount?.id === account.id ? account : state.selectedAccount,
    })),
}));

export const useBotStore = create<BotState>((set) => ({
  bots: [],
  selectedBot: null,
  setBots: (bots) => set({ bots }),
  setSelectedBot: (selectedBot) => set({ selectedBot }),
}));

export const useTradeStore = create<TradeState>((set) => ({
  trades: [],
  stats: null,
  setTrades: (trades) => set({ trades }),
  setStats: (stats) => set({ stats }),
}));

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 10),
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
