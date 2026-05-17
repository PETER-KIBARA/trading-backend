import { useEffect } from 'react';
import { useAuthStore } from '../context/store';
import { apiClient } from '../services/api';
import { wsClient } from '../services/websocket';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setAuthenticated, setLoading } = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      const { user, tokens } = response.data;

      apiClient.setToken(tokens.accessToken);
      setUser(user);
      setAuthenticated(true);

      // Connect WebSocket
      await wsClient.connect(user.id);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      await apiClient.register(email, password, firstName, lastName);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      apiClient.clearToken();
      wsClient.disconnect();
      setUser(null);
      setAuthenticated(false);
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      setUser(response.data.user);
      setAuthenticated(true);
    } catch (error: any) {
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load profile if token exists in localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
};
