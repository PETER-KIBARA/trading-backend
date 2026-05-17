import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export interface UserPreferences {
  theme?: 'dark' | 'light' | 'auto';
  autoRefresh?: number; // in seconds
  marketAlerts?: boolean;
  notifications?: 'disabled' | 'desktop' | 'email' | 'both';
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
}

export interface UserSettings {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updating: boolean;
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>({
    preferences: {
      theme: 'dark',
      autoRefresh: 30,
      marketAlerts: true,
      notifications: 'both',
      twoFactorEnabled: false,
      emailVerified: true,
    },
    loading: true,
    error: null,
    updating: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setSettings((prev) => ({ ...prev, loading: true, error: null }));
      
      const response = await apiClient.getUserPreferences();
      const userData = response.data.user || response.data;

      setSettings((prev) => ({
        ...prev,
        preferences: userData.preferences || {
          theme: 'dark',
          autoRefresh: 30,
          marketAlerts: true,
          notifications: 'both',
          twoFactorEnabled: userData.twoFactorEnabled || false,
          emailVerified: userData.emailVerified || true,
        },
        loading: false,
      }));
    } catch (error: any) {
      setSettings((prev) => ({
        ...prev,
        error: error.message || 'Failed to load settings',
        loading: false,
      }));
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      setSettings((prev) => ({ ...prev, updating: true }));
      
      await apiClient.updateUserPreferences(newPreferences);

      setSettings((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, ...newPreferences },
        updating: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update settings';
      setSettings((prev) => ({
        ...prev,
        error: errorMsg,
        updating: false,
      }));
      return { success: false, error: errorMsg };
    }
  };

  return {
    preferences: settings.preferences,
    loading: settings.loading,
    error: settings.error,
    updating: settings.updating,
    updatePreferences,
    refresh: loadSettings,
  };
};
