'use client';

import { MarketSummary } from '@/lib/types';

interface MarketCardProps {
  market: MarketSummary;
  onExpand: () => void;
}

export function MarketCard({ market, onExpand }: MarketCardProps) {
  // Calculate yes price from bid/ask
  const yesPrice = (market.yes_bid + market.yes_ask) / 2;
  const noPrice = 100 - yesPrice;

  // Determine icon color based on which side is winning
  const isYesWinning = yesPrice > 50;
  const borderColor = isYesWinning ? 'border-emerald-500' : yesPrice < 50 ? 'border-rose-500' : 'border-gray-400';

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all">
      {/* Card Content */}
      <div className="p-4">
        {/* Header with Price Circle and Title */}
        <div className="flex gap-3 mb-4">
          {/* Price Circle */}
          <div className={`w-12 h-12 rounded-lg border-2 ${borderColor} flex items-center justify-center flex-shrink-0`}>
            <span className={`text-sm font-bold ${isYesWinning ? 'text-emerald-500' : yesPrice < 50 ? 'text-rose-500' : 'text-gray-400'}`}>
              {Math.round(yesPrice)}%
            </span>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
              {market.title}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              {market.ticker}
            </span>
          </div>
        </div>

        {/* Price Display */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(yesPrice)}%
          </span>
          <div className="flex-1 h-2 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${yesPrice}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${noPrice}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatVolume(market.volume)}
        </span>
        <button
          onClick={onExpand}
          className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function formatVolume(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'Vol: --';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num}`;
}
