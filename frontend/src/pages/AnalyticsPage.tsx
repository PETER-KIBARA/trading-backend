import React from 'react';
import { BarChart3, CalendarDays, Clock3, LineChart, PieChart, TrendingUp, AlertCircle } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

export const AnalyticsPage: React.FC = () => {
  const { metrics, timeline, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="mini-pill w-32 animate-pulse">&nbsp;</div>
          <div className="mt-4 h-10 w-72 rounded-2xl bg-white/10" />
          <div className="mt-3 h-5 w-96 rounded-2xl bg-white/5" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="stat-card h-32 animate-pulse bg-white/5" />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="surface h-96 animate-pulse bg-white/5" />
          <div className="surface h-96 animate-pulse bg-white/5" />
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
            <h1 className="text-xl font-semibold text-white">Failed to load analytics</h1>
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
            {timeline.length === 0 ? (
              <p className="text-center text-slate-400 py-4">No timeline events yet. Start trading to see activity.</p>
            ) : (
              timeline.map((item) => (
                <div key={item.time} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.time}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.event}</p>
                    </div>
                    <span className="badge border-white/10 bg-white/5 text-slate-200">{item.impact}</span>
                  </div>
                </div>
              ))
            )}
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