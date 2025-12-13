'use client';

import { useState, useEffect } from 'react';
import { MarketSummary, PriceHistory } from '@/lib/types';
import { getMarketsWithHistory } from '@/lib/api';
import { MarketCard } from '@/components/cards/MarketCard';
import { MarketCardExpanded } from '@/components/cards/MarketCardExpanded';
import { Modal } from '@/components/ui/Modal';
import { LoadingCard } from '@/components/ui/LoadingSpinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

type MarketWithHistory = { market: MarketSummary; history: PriceHistory };

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<MarketWithHistory | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMarketsWithHistory(20);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Markets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Trending prediction markets with AI analysis
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={fetchData} />
        </div>
      )}

      {/* Loading State */}
      {loading && markets.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      )}

      {/* Market Cards Grid */}
      {!loading && markets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {markets.map(({ market, history }) => (
            <MarketCard
              key={market.ticker}
              market={market}
              onExpand={() => setSelectedMarket({ market, history })}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && markets.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No markets available</p>
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
  );
}
