'use client';

import { useState, useEffect } from 'react';
import { MarketSummary, PriceHistory } from '@/lib/types';
import { getMarketsWithHistory } from '@/lib/api';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { MarketCardExpanded } from '@/components/cards/MarketCardExpanded';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatPrice } from '@/lib/utils';
import { getChartColor } from '@/lib/colors';

type MarketWithHistory = { market: MarketSummary; history: PriceHistory };

export default function DashboardPage() {
  const [markets, setMarkets] = useState<MarketWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<MarketWithHistory | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMarketsWithHistory(10);
      setMarkets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-950 overflow-hidden">
      <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Comparing 10 trending markets over the past 30 days
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex-shrink-0 px-6 py-4">
            <ErrorBanner message={error} onRetry={fetchData} />
          </div>
        )}

        {/* Loading State */}
        {loading && markets.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <LoadingState message="Loading market data..." />
          </div>
        )}

        {/* Main Content - Two Columns */}
        {!loading && markets.length > 0 && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column - Scrollable Market Summary (30%) */}
            <div className="w-[30%] border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Market Summary
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {markets.map(({ market, history }, index) => {
                    // Calculate current price from bid/ask
                    const currentPrice = (market.yes_bid + market.yes_ask) / 2;
                    // Use backend-provided price change
                    const change = history.price_change_30d;
                    const changePercent = history.price_change_pct;

                    return (
                      <div
                        key={market.ticker}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                        onMouseEnter={() => setHoveredTicker(market.ticker)}
                        onMouseLeave={() => setHoveredTicker(null)}
                        onClick={() => setSelectedMarket({ market, history })}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: getChartColor(index) }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {market.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatPrice(currentPrice)}
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  change > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : change < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {change > 0 ? '+' : ''}
                                {change.toFixed(1)}¢
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  changePercent > 0
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                    : changePercent < 0
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {changePercent > 0 ? '+' : ''}
                                {changePercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Time Series Chart (70%) */}
            <div className="w-[70%] p-4 flex flex-col overflow-hidden">
              <TimeSeriesChart data={markets} hoveredTicker={hoveredTicker} />
            </div>
          </div>
        )}

        {/* Market Detail Modal */}
        <Modal isOpen={!!selectedMarket} onClose={() => setSelectedMarket(null)}>
          {selectedMarket && (
            <MarketCardExpanded
              market={selectedMarket.market}
              history={selectedMarket.history}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}
