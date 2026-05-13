import React from 'react';
import { BarChart3, CalendarDays, Clock3, LineChart, PieChart, TrendingUp } from 'lucide-react';

const metrics = [
  { label: 'Daily win rate', value: '68.4%', delta: '+4.1%', badge: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' },
  { label: 'Avg. trade return', value: '+$18.42', delta: '+2.7%', badge: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' },
  { label: 'Risk utilization', value: '41%', delta: '-8%', badge: 'border-violet-400/20 bg-violet-400/10 text-violet-200' },
  { label: 'Sharpe ratio', value: '1.92', delta: '+0.3', badge: 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200' },
];

const timeline = [
  { time: '09:15', event: 'Momentum bot opened 3 trades', impact: '+$142.20' },
  { time: '11:40', event: 'Risk cap tightened automatically', impact: 'Guardrail' },
  { time: '14:05', event: 'Closed volatility session', impact: '+$88.10' },
  { time: '18:30', event: 'Daily summary generated', impact: 'Complete' },
];

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="surface-strong p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mini-pill">
              <BarChart3 size={14} /> Insights
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Analytics</h1>
            <p className="section-subtitle">
              Track performance, efficiency, and risk from a calm, high-contrast analytics workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary">
              <CalendarDays size={16} /> This week
            </button>
            <button className="btn-primary">
              <LineChart size={16} /> Export report
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="stat-card">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className={`badge ${metric.badge}`}>
                {metric.delta}
              </span>
              <span className="text-slate-400">vs last period</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Performance overview</h2>
              <p className="mt-1 text-sm text-slate-400">A compact view of daily outcomes and execution quality.</p>
            </div>
            <PieChart className="text-fuchsia-300" size={20} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Best session</p>
              <p className="mt-3 text-2xl font-semibold text-white">+$1,284.20</p>
              <p className="mt-2 text-sm text-emerald-300">Volatility Edge / 38 trades</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Worst session</p>
              <p className="mt-3 text-2xl font-semibold text-white">-$76.50</p>
              <p className="mt-2 text-sm text-rose-300">Mean Reversion / 9 trades</p>
            </div>
          </div>
          <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
            Add live charting here to compare equity curve, drawdown, and session heatmaps.
          </div>
        </div>

        <div className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Activity timeline</h2>
              <p className="mt-1 text-sm text-slate-400">Recent signal and session events.</p>
            </div>
            <Clock3 className="text-cyan-300" size={20} />
          </div>

          <div className="mt-5 space-y-3">
            {timeline.map((item) => (
              <div key={item.time} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.time}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.event}</p>
                  </div>
                  <span className="badge border-white/10 bg-white/5 text-slate-200">{item.impact}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <TrendingUp size={16} className="inline-block text-emerald-300" /> {' '}
            Performance summaries can be expanded into trade-by-trade analytics, exportable reports, and strategy comparisons.
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;