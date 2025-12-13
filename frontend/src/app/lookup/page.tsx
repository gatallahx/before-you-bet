'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LookupPage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Extract ticker from Kalshi URL or use direct ticker input
  const extractTicker = (value: string): string | null => {
    const trimmed = value.trim();

    // Check if it's a URL
    if (trimmed.includes('kalshi.com')) {
      // Handle various Kalshi URL formats:
      // https://kalshi.com/markets/TICKER
      // https://kalshi.com/markets/TICKER/some-slug
      // https://www.kalshi.com/markets/TICKER
      const match = trimmed.match(/kalshi\.com\/markets\/([A-Z0-9_-]+)/i);
      if (match) {
        return match[1].toUpperCase();
      }
      return null;
    }

    // Otherwise treat as direct ticker (alphanumeric, underscores, hyphens)
    if (/^[A-Z0-9_-]+$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ticker = extractTicker(input);
    if (!ticker) {
      setError('Please enter a valid Kalshi URL or ticker symbol');
      return;
    }

    router.push(`/lookup/${ticker}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Market Lookup
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter a Kalshi market URL or ticker to get detailed predictions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ticker-input" className="sr-only">
            Kalshi URL or Ticker
          </label>
          <input
            id="ticker-input"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="https://kalshi.com/markets/TICKER or TICKER"
            className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!input.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Look Up Market
        </button>
      </form>

      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Supported Formats
        </h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span>
              <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                https://kalshi.com/markets/TICKER
              </code>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span>
              <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                TICKER
              </code>
              {' '}(direct ticker symbol)
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
