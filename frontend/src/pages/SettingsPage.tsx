import React from 'react';
import { Bell, Lock, Monitor, ShieldCheck, UserCircle2 } from 'lucide-react';

const sections = [
  { title: 'Profile', icon: UserCircle2, description: 'Update your public identity and display preferences.' },
  { title: 'Security', icon: Lock, description: 'Manage passwords, tokens, and session protection.' },
  { title: 'Alerts', icon: Bell, description: 'Choose how you want to receive trade and bot notifications.' },
  { title: 'Platform', icon: Monitor, description: 'Customize how the workspace feels and behaves.' },
];

export const SettingsPage: React.FC = () => {
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
          <button className="btn-primary">Save changes</button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map(({ title, icon: Icon, description }) => (
          <div key={title} className="surface p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-violet-300">
                <Icon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Account security</h2>
          <p className="mt-1 text-sm text-slate-400">Recommended defaults for a trading platform.</p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            {['Two-factor authentication', 'Device session tracking', 'Encrypted token storage', 'Activity notifications'].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Platform preferences</h2>
          <p className="mt-1 text-sm text-slate-400">Tune the experience for the way you work.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { label: 'Theme', value: 'Dark command center' },
              { label: 'Market alerts', value: 'Enabled' },
              { label: 'Auto refresh', value: '30s' },
              { label: 'Notifications', value: 'Desktop + email' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;