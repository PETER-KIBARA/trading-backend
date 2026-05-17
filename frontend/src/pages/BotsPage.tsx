import React from 'react';
import { Activity, BarChart3, Bot, PlayCircle, Shield, Sparkles, Zap, AlertCircle } from 'lucide-react';
import { useBots } from '../hooks/useBots';

export const BotsPage: React.FC = () => {
  const { bots, templates, activeBotCount, monthlyPnL, riskEvents, loading, error } = useBots();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="mini-pill w-32 animate-pulse">&nbsp;</div>
          <div className="mt-4 h-10 w-72 rounded-2xl bg-white/10" />
          <div className="mt-3 h-5 w-96 rounded-2xl bg-white/5" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="stat-card h-24 animate-pulse bg-white/5" />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="surface h-80 animate-pulse bg-white/5" />
          <div className="surface h-80 animate-pulse bg-white/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface border border-red-500/20 bg-red-500/10 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-red-300" size={20} />
          <div>
            <h1 className="text-xl font-semibold text-white">Failed to load bots</h1>
            <p className="mt-1 text-slate-300">{error}</p>
          </div>
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
              <Bot size={14} /> Strategy control
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Bots</h1>
            <p className="section-subtitle">
              Manage automated strategies, review performance, and launch new trading ideas from one command surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary">
              <Sparkles size={16} /> Create bot
            </button>
            <button className="btn-primary">
              <PlayCircle size={16} /> Launch strategy
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Active bots', value: activeBotCount.toString(), icon: Activity, tone: 'text-emerald-300' },
          { label: 'Monthly P/L', value: formatCurrency(monthlyPnL), icon: BarChart3, tone: 'text-cyan-300' },
          { label: 'Risk events', value: riskEvents.toString(), icon: Shield, tone: 'text-fuchsia-300' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
              </div>
              <div className={`rounded-2xl border border-white/10 bg-white/5 p-3 ${tone}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Bot templates</h2>
          <p className="mt-1 text-sm text-slate-400">Quick-start strategies ready to customize.</p>
          <div className="mt-5 space-y-3">
            {templates.map((item) => (
              <div key={item.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-slate-400">Strategy: {item.strategy}</p>
                  </div>
                  <span className={`badge ${item.badge}`}>
                    Ready
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Active bots</h2>
          <p className="mt-1 text-sm text-slate-400">Current performance snapshot of live automation.</p>
          <div className="mt-5 space-y-3">
            {bots.length === 0 ? (
              <p className="text-center text-slate-400 py-4">No bots created yet. Start by creating one from the templates.</p>
            ) : (
              bots.map((bot) => (
                <div key={bot.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{bot.name}</p>
                      <p className="text-sm text-slate-400">{bot.trades} trades</p>
                    </div>
                    <span className={`badge ${bot.status === 'active' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : bot.status === 'paused' ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-200'}`}>
                      {bot.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                    <span>Realized P/L</span>
                    <span className={bot.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{formatCurrency(bot.pnl)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Execution controls</h2>
            <p className="mt-1 text-sm text-slate-400">Build, pause, and monitor automated strategies from one place.</p>
          </div>
          <Zap className="text-cyan-300" size={20} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {['Strategy builder', 'Risk guardrails', 'Trade lifecycle'].map((item) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BotsPage;