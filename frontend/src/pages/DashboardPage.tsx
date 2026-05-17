import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Signal,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboardData } from '../hooks/useDashboardData';

export const DashboardPage: React.FC = () => {
  const { snapshot, loading, error, accountBalance, dailyPnL, winRate, activeBots, recentTrades } = useDashboardData();

  const chartData = useMemo(() => {
    if (!snapshot?.recentTrades?.length) return [];

    let cumulative = 0;
    return snapshot.recentTrades
      .slice()
      .reverse()
      .map((trade, index) => {
        const profit = trade.pnl ?? trade.profit ?? 0;
        cumulative += profit;
        return {
          label: `Trade ${index + 1}`,
          profit: cumulative,
        };
      });
  }, [snapshot?.recentTrades]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
      case 'lost':
        return 'border-rose-400/20 bg-rose-400/10 text-rose-200';
      case 'open':
        return 'border-sky-400/20 bg-sky-400/10 text-sky-200';
      default:
        return 'border-white/10 bg-white/5 text-slate-200';
    }
  };

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

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="surface h-[420px] animate-pulse bg-white/5" />
          <div className="surface h-[420px] animate-pulse bg-white/5" />
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
            <h1 className="text-xl font-semibold text-white">Dashboard unavailable</h1>
            <p className="mt-1 text-sm text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot?.defaultAccount) {
    return (
      <div className="space-y-6">
        <section className="surface-strong p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mini-pill">
                <CircleDollarSign size={14} /> Welcome to TradeAI
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Let's get started</h1>
              <p className="section-subtitle">
                Connect your Deriv account to start automating trades and monitoring your portfolio.
              </p>
            </div>
          </div>
        </section>

        <section className="surface border border-amber-400/20 bg-amber-400/10 p-6">
          <div className="flex items-start gap-4">
            <CircleDollarSign className="mt-0.5 text-amber-200 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-amber-50">No trading account connected</h2>
              <p className="mt-2 text-sm text-amber-100/90 mb-4">
                Add a Deriv account to unlock the dashboard experience, including real-time balance sync, bot management, and trading analytics.
              </p>
              <Link
                to="/connect-deriv"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition"
              >
                <CircleDollarSign size={16} />
                Connect Deriv Account
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="surface p-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-fuchsia-300" />
              Key Features
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>✓ Real-time balance synchronization</li>
              <li>✓ Advanced trading bots</li>
              <li>✓ Risk management tools</li>
              <li>✓ Performance analytics</li>
            </ul>
          </div>

          <div className="surface p-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-cyan-300" />
              Security First
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>✓ Encrypted token storage</li>
              <li>✓ OAuth 2.0 authentication</li>
              <li>✓ No email/password stored</li>
              <li>✓ Trade execution only</li>
            </ul>
          </div>
        </section>
      </div>
    );
  }

  const stats = [
    {
      label: 'Account balance',
      value: formatCurrency(accountBalance),
      change: accountBalance >= 0 ? 'Live balance sync' : 'Balance unavailable',
      icon: CircleDollarSign,
      tone: 'text-emerald-300',
    },
    {
      label: 'Today P/L',
      value: formatCurrency(dailyPnL),
      change: dailyPnL >= 0 ? 'Positive session' : 'Drawdown in progress',
      icon: dailyPnL >= 0 ? ArrowUpRight : ArrowDownRight,
      tone: dailyPnL >= 0 ? 'text-emerald-300' : 'text-rose-300',
    },
    {
      label: 'Win rate',
      value: `${winRate.toFixed(1)}%`,
      change: snapshot.tradeStats ? `${snapshot.tradeStats.winCount}/${snapshot.tradeStats.totalTrades} wins` : 'No trades yet',
      icon: TrendingUp,
      tone: 'text-sky-300',
    },
    {
      label: 'Active bots',
      value: `${activeBots}`,
      change: `${snapshot.bots.length} configured`,
      icon: Zap,
      tone: 'text-fuchsia-300',
    },
  ];

  const riskStatus = snapshot.riskSummary
    ? snapshot.riskSummary.maxDailyLossReached
      ? { label: 'Limit reached', tone: 'border-rose-400/20 bg-rose-400/10 text-rose-200' }
      : { label: 'Healthy', tone: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' }
    : { label: 'Unavailable', tone: 'border-white/10 bg-white/5 text-slate-200' };

  return (
    <div className="space-y-6">
      <section className="surface-strong overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mini-pill">
              <Sparkles size={14} /> Command center
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Dashboard</h1>
            <p className="section-subtitle">
              Monitor your active account, strategy performance, and risk posture from one polished trading workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Account</p>
              <p className="mt-2 text-sm font-semibold text-white">{snapshot.defaultAccount.accountName}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Type</p>
              <p className="mt-2 text-sm font-semibold text-white capitalize">{snapshot.defaultAccount.accountType}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Connection</p>
              <p className="mt-2 text-sm font-semibold text-white capitalize">{snapshot.defaultAccount.connectionStatus || 'unknown'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, change, icon: Icon, tone }) => (
          <article key={label} className="stat-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
              </div>
              <div className={`rounded-2xl border border-white/10 bg-white/5 p-3 ${tone}`}>
                <Icon size={18} />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">{change}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <div className="surface p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Performance curve</h2>
                <p className="mt-1 text-sm text-slate-400">Cumulative profit from your latest closed trades.</p>
              </div>
              <div className="mini-pill">
                <Activity size={14} /> Live overview
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tradeProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '18px',
                        color: '#f8fafc',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="profit" stroke="#a855f7" fill="url(#tradeProfit)" strokeWidth={2.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid min-h-[320px] place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] text-center">
                <div>
                  <Target className="mx-auto text-slate-500" size={28} />
                  <p className="mt-4 text-lg font-semibold text-white">No performance data yet</p>
                  <p className="mt-2 text-sm text-slate-400">Open and close a few trades to visualize your curve here.</p>
                </div>
              </div>
            )}
          </div>

          <div className="surface p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Recent trades</h2>
                <p className="mt-1 text-sm text-slate-400">The latest trade activity from your account.</p>
              </div>
              <div className="mini-pill">
                <Clock3 size={14} /> {recentTrades.length} items
              </div>
            </div>

            {recentTrades.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center text-slate-400">
                No trades yet. Launch a bot or execute a manual trade to populate this section.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrades.slice(0, 6).map((trade) => {
                  const pnl = trade.pnl ?? trade.profit ?? 0;
                  return (
                    <div key={trade.id} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">{trade.contractType}</span>
                          <span className={`badge ${statusBadge(trade.status)}`}>{trade.status}</span>
                        </div>
                        <p className="text-sm text-slate-400">{trade.symbol || trade.marketType || 'Market trade'} • {formatDate(trade.openTime || trade.openedAt)}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className={`text-lg font-semibold ${pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </p>
                        <p className="text-sm text-slate-400">Stake {formatCurrency(trade.stake || 0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="surface p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Account snapshot</h2>
            <p className="mt-1 text-sm text-slate-400">Current state of the selected trading account.</p>

            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Balance</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(snapshot.defaultAccount.balance || accountBalance)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Bots</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{snapshot.bots.length}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Open</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{snapshot.openTrades.length}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Risk posture</p>
                    <p className="mt-2 text-base font-semibold text-white">{riskStatus.label}</p>
                  </div>
                  <span className={`badge ${riskStatus.tone}`}>{riskStatus.label}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-slate-300">
                    <p className="text-slate-500">Trades today</p>
                    <p className="mt-1 text-white">{snapshot.riskSummary?.tradesToday ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-slate-300">
                    <p className="text-slate-500">Daily P/L</p>
                    <p className="mt-1 text-white">{formatCurrency(snapshot.riskSummary?.dailyPnL ?? 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="surface p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Bot health</h2>
            <p className="mt-1 text-sm text-slate-400">Quick summary of your automation layer.</p>

            <div className="mt-5 space-y-3">
              {snapshot.bots.slice(0, 4).map((bot) => (
                <div key={bot.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{bot.name}</p>
                      <p className="text-sm text-slate-400">{bot.strategyType}</p>
                    </div>
                    <span className={`badge ${bot.status === 'active' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-200'}`}>
                      {bot.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-300">
                    <div>
                      <p className="text-slate-500">Trades</p>
                      <p className="mt-1 text-white">{bot.totalTrades ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Win</p>
                      <p className="mt-1 text-white">{(bot.winRate ?? 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500">PnL</p>
                      <p className="mt-1 text-white">{formatCurrency(bot.totalPnL ?? 0)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {snapshot.bots.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-8 text-center text-sm text-slate-400">
                  No bots configured yet.
                </div>
              )}
            </div>
          </div>

          <div className="surface p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">Operational notes</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Signal size={16} className="text-cyan-300" />
                WebSocket updates remain live while the page is open.
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <ShieldCheck size={16} className="text-emerald-300" />
                Risk controls will pause automation when limits are reached.
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default DashboardPage;