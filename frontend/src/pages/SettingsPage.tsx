import React, { useState } from 'react';
import { Bell, Lock, Monitor, ShieldCheck, UserCircle2, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';

export const SettingsPage: React.FC = () => {
  const { preferences, loading, error, updating, updatePreferences } = useUserSettings();
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formState, setFormState] = useState(preferences);

  // Update form state when preferences load
  React.useEffect(() => {
    setFormState(preferences);
  }, [preferences]);

  const handleSaveChanges = async () => {
    setSaveStatus(null);
    const result = await updatePreferences(formState);
    if (result.success) {
      setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus({ type: 'error', message: result.error || 'Failed to save settings' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin inline-block mb-4" size={32} />
          <p className="text-slate-300">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-strong p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mini-pill">
              <ShieldCheck size={14} /> Workspace settings
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Settings</h1>
            <p className="section-subtitle">
              Keep your profile, alerts, and platform preferences aligned with the way you trade.
            </p>
          </div>
          <button 
            onClick={handleSaveChanges}
            disabled={updating}
            className="btn-primary flex items-center gap-2"
          >
            {updating && <Loader size={16} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </section>

      {error && (
        <div className="surface border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-red-300 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-red-200">Error</h3>
            <p className="text-sm text-red-100 mt-1">{error}</p>
          </div>
        </div>
      )}

      {saveStatus && (
        <div className={`surface border p-4 flex items-start gap-3 ${
          saveStatus.type === 'success' 
            ? 'border-emerald-500/20 bg-emerald-500/10' 
            : 'border-red-500/20 bg-red-500/10'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 text-emerald-300 flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="mt-0.5 text-red-300 flex-shrink-0" size={20} />
          )}
          <div>
            <h3 className={`font-semibold ${saveStatus.type === 'success' ? 'text-emerald-200' : 'text-red-200'}`}>
              {saveStatus.type === 'success' ? 'Success' : 'Error'}
            </h3>
            <p className={`text-sm mt-1 ${saveStatus.type === 'success' ? 'text-emerald-100' : 'text-red-100'}`}>
              {saveStatus.message}
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Security Settings */}
        <div className="surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Account security</h2>
          <p className="mt-1 text-sm text-slate-400">Recommended defaults for a trading platform.</p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
              <span>Two-factor authentication</span>
              <input 
                type="checkbox" 
                checked={formState.twoFactorEnabled || false}
                onChange={(e) => setFormState({ ...formState, twoFactorEnabled: e.target.checked })}
                className="w-4 h-4"
              />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              Device session tracking
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              Encrypted token storage
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
              <span>Activity notifications</span>
              <input 
                type="checkbox" 
                defaultChecked
                className="w-4 h-4"
              />
            </div>
          </div>
        </div>

        {/* Platform Preferences */}
        <div className="surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Platform preferences</h2>
          <p className="mt-1 text-sm text-slate-400">Tune the experience for the way you work.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Theme</p>
              <select 
                value={formState.theme || 'dark'}
                onChange={(e) => setFormState({ ...formState, theme: e.target.value as any })}
                className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="dark">Dark command center</option>
                <option value="light">Light mode</option>
                <option value="auto">Auto (system)</option>
              </select>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Market alerts</p>
              <select 
                value={formState.marketAlerts ? 'enabled' : 'disabled'}
                onChange={(e) => setFormState({ ...formState, marketAlerts: e.target.value === 'enabled' })}
                className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Auto refresh</p>
              <select 
                value={formState.autoRefresh || 30}
                onChange={(e) => setFormState({ ...formState, autoRefresh: parseInt(e.target.value) })}
                className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Notifications</p>
              <select 
                value={formState.notifications || 'both'}
                onChange={(e) => setFormState({ ...formState, notifications: e.target.value as any })}
                className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="disabled">Disabled</option>
                <option value="desktop">Desktop only</option>
                <option value="email">Email only</option>
                <option value="both">Desktop + Email</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;