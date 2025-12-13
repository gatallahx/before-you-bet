'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MarketData, PriceHistory, LLMEstimate } from '@/lib/types';
import { getMarket, getHistory, getEstimate } from '@/lib/api';
import { MarketCardExpanded } from '@/components/cards/MarketCardExpanded';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

export default function TickerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = params.ticker as string;

  const [market, setMarket] = useState<MarketData | null>(null);
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [estimate, setEstimate] = useState<LLMEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [marketData, historyData, estimateData] = await Promise.allSettled([
        getMarket(ticker),
        getHistory(ticker, 30),
        getEstimate(ticker),
      ]);

      // Market data is required
      if (marketData.status === 'rejected') {
        throw new Error(`Market not found: ${ticker}`);
      }
      setMarket(marketData.value);

      // History is required for the expanded card
      if (historyData.status === 'rejected') {
        throw new Error('Failed to load price history');
      }
      setHistory(historyData.value);

      // Estimate is optional - set to null if failed
      if (estimateData.status === 'fulfilled') {
        setEstimate(estimateData.value);
      } else {
        setEstimate(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticker) {
      fetchData();
    }
  }, [ticker]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href="/lookup"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lookup
        </Link>
      </div>

      {/* Ticker header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-lg">
            {ticker}
          </span>
          {!loading && market && (
            <span className="text-gray-500 dark:text-gray-400 font-normal text-base truncate">
              {market.title}
            </span>
          )}
        </h1>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <LoadingState message={`Loading ${ticker}...`} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="py-8">
          <ErrorBanner message={error} onRetry={fetchData} />
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/lookup')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try a different ticker
            </button>
          </div>
        </div>
      )}

      {/* Market detail card */}
      {!loading && !error && market && history && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <MarketCardExpanded
            market={market}
            history={history}
            estimate={estimate ?? undefined}
          />
        </div>
      )}

      {/* Kalshi link */}
      {!loading && !error && market && (
        <div className="mt-6 text-center">
          <a
            href={`https://kalshi.com/markets/${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            View on Kalshi
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
