import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'https://trading-backend-bgks.onrender.com/api',
      timeout: 10000,
    });

    // Load token from localStorage
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      this.token = storedToken;
      this.updateAuthHeader();
    }

    // Add request interceptor
    this.instance.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('accessToken', token);
    this.updateAuthHeader();
  }

  private updateAuthHeader(): void {
    if (this.token) {
      this.instance.defaults.headers.common.Authorization = `Bearer ${this.token}`;
    }
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('accessToken');
    delete this.instance.defaults.headers.common.Authorization;
  }

  // Auth endpoints
  register(email: string, password: string, firstName: string, lastName: string) {
    return this.instance.post('/auth/register', { email, password, firstName, lastName });
  }

  login(email: string, password: string) {
    return this.instance.post('/auth/login', { email, password });
  }

  getProfile() {
    return this.instance.get('/auth/profile');
  }

  updateProfile(data: any) {
    return this.instance.put('/auth/profile', data);
  }

  // Account endpoints
  addAccount(accountId: string, accountName: string, token: string, accountType: string) {
    return this.instance.post('/accounts', { accountId, accountName, token, accountType });
  }

  getAccounts() {
    return this.instance.get('/accounts');
  }

  getDefaultAccount() {
    return this.instance.get('/accounts/default');
  }

  syncAllBalances() {
    return this.instance.post('/accounts/sync');
  }

  getAccount(accountId: string) {
    return this.instance.get(`/accounts/${accountId}`);
  }

  syncBalance(accountId: string) {
    return this.instance.post(`/accounts/${accountId}/sync-balance`);
  }

  // Trade endpoints
  getOpenTrades(accountId: string) {
    return this.instance.get(`/trades/${accountId}/open`);
  }

  getTradeHistory(accountId: string, limit = 50, offset = 0, symbol?: string) {
    return this.instance.get(`/trades/${accountId}/history`, { params: { limit, offset, symbol } });
  }

  getTradeStats(accountId: string) {
    return this.instance.get(`/trades/${accountId}/stats`);
  }

  // Bot endpoints
  createBot(data: any) {
    return this.instance.post('/bots', data);
  }

  getBots() {
    return this.instance.get('/bots');
  }

  getBot(botId: string) {
    return this.instance.get(`/bots/${botId}`);
  }

  getBotStats(botId: string) {
    return this.instance.get(`/bots/${botId}/stats`);
  }

  updateBot(botId: string, data: any) {
    return this.instance.put(`/bots/${botId}`, data);
  }

  startBot(botId: string) {
    return this.instance.post(`/bots/${botId}/start`);
  }

  stopBot(botId: string) {
    return this.instance.post(`/bots/${botId}/stop`);
  }

  pauseBot(botId: string) {
    return this.instance.post(`/bots/${botId}/pause`);
  }

  resumeBot(botId: string) {
    return this.instance.post(`/bots/${botId}/resume`);
  }

  deleteBot(botId: string) {
    return this.instance.delete(`/bots/${botId}`);
  }

  // Risk endpoints
  getRiskSummary() {
    return this.instance.get('/risk/summary');
  }

  getRiskSettings() {
    return this.instance.get('/risk/settings');
  }
}

export const apiClient = new ApiClient();
