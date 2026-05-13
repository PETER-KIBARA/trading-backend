import React from 'react';
import { Sparkles } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-strong w-full max-w-md p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
          <Sparkles className="animate-pulse" size={28} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-white">TradeAI</h1>
        <p className="mt-2 text-sm text-slate-400">Loading your trading workspace...</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
