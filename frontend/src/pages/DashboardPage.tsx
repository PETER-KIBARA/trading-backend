import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';

export const DashboardPage: React.FC = () => {
  const { snapshot, loading, error, accountBalance, dailyPnL, winRate, activeBots, recentTrades } = useDashboardData();

  // Process trade history for chart
  const chartData = useMemo(() => {
    if (!snapshot?.recentTrades || snapshot.recentTrades.length === 0) {
      return [];
    }

    // Create cumulative profit chart from trade history
    let cumProfit = 0;
    return snapshot.recentTrades
      .slice()
      .reverse()
      .map((trade, idx) => {
        const tradeProfit = trade.pnl || trade.profit || 0;
        cumProfit += tradeProfit;
        return {
          time: `Trade ${idx + 1}`,
          profit: cumProfit,
          tradeId: trade.id,
        };
      });
  }, [snapshot?.recentTrades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-500/20 text-green-400';
      case 'lost':
        return 'bg-red-500/20 text-red-400';
      case 'open':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Loading your trading overview...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-glass h-24 animate-pulse bg-slate-800/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        </div>
        <div className="card-glass border border-red-500/50 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="text-red-400 mt-1 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-semibold">Error Loading Dashboard</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot?.defaultAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        </div>
        <div className="card-glass border border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="text-yellow-400">No account found. Please add a trading account to get started.</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Balance',
      value: formatCurrency(accountBalance),
      change: `${accountBalance > 0 ? '+' : ''}${formatCurrency(accountBalance)}`,
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Today Profit',
      value: formatCurrency(dailyPnL),
      change: `${dailyPnL > 0 ? '+' : ''}${dailyPnL.toFixed(2)}%`,
      icon: dailyPnL >= 0 ? TrendingUp : TrendingDown,
      color: dailyPnL >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      change: snapshot.tradeStats ? `${snapshot.tradeStats.winCount}/${snapshot.tradeStats.totalTrades} trades` : '0/0',
      icon: Zap,
      color: 'text-blue-400',
    },
    {
      label: 'Active Bots',
      value: `${activeBots}`,
      change: `${snapshot.bots.length} total`,
      icon: Zap,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">
          Account: <span className="text-white">{snapshot.defaultAccount.accountName}</span>
          {snapshot.defaultAccount.accountType === 'demo' && <span className="text-yellow-400 ml-2">(Demo)</span>}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div key={i} className="card-glass">
              <div className="flex items-start justify-between mb-2">
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <IconComponent className={`${stat.color} w-4 h-4`} />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className={`text-sm ${stat.color}`}>{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Risk Summary */}
      {snapshot.riskSummary && (
        <div className="card-glass">
          <h2 className="text-xl font-bold text-white mb-4">Risk Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Open Trades</p>
              <p className="text-2xl font-bold text-white">{snapshot.riskSummary.openTrades}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Trades Today</p>
              <p className="text-2xl font-bold text-white">{snapshot.riskSummary.tradesToday}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Daily P/L Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    snapshot.riskSummary.maxDailyLossReached ? 'bg-red-500' : 'bg-green-500'
                  }`}
                ></div>
                <p className={`font-semibold ${snapshot.riskSummary.maxDailyLossReached ? 'text-red-400' : 'text-green-400'}`}>
                  {snapshot.riskSummary.maxDailyLossReached ? 'Max Loss Reached' : 'Normal'}
                </p>
              </div>
            </div>
          </div>
          {snapshot.riskSummary.maxDailyLossReached && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                ⚠️ Maximum daily loss reached. No new trades will be opened until reset.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card-glass">
          <h2 className="text-xl font-bold text-white mb-4">Cumulative Profit</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Trades */}
      <div className="card-glass">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Trades</h2>
          <span className="text-slate-400 text-sm">Last {recentTrades.length} trades</span>
        </div>
        {recentTrades.length === 0 ? (
          <p className="text-slate-400 py-8 text-center">No trades yet. Start a bot to begin trading.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-2 text-slate-400 text-sm">Type</th>
                  <th className="text-left px-4 py-2 text-slate-400 text-sm">Status</th>
                  <th className="text-left px-4 py-2 text-slate-400 text-sm">Stake</th>
                  <th className="text-left px-4 py-2 text-slate-400 text-sm">Entry Time</th>
                  <th className="text-right px-4 py-2 text-slate-400 text-sm">P/L</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => {
                  const profit = trade.profit || 0;
                  const entryTime = new Date(trade.openTime || trade.openedAt || '').toLocaleTimeString();

                  return (
                    <tr key={trade.id} className="border-b border-slate-800 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-semibold">{trade.contractType}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBg(trade.status)}`}>
                          {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{formatCurrency(trade.stake)}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{entryTime}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
