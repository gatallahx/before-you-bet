import { MarketSummary, MarketData, PriceHistory, PriceCandle, LLMEstimate, RawHistoryResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getMarkets(limit = 100): Promise<MarketSummary[]> {
  const res = await fetch(`${API_URL}/markets?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch markets');
  return res.json();
}

export async function getMarket(ticker: string): Promise<MarketData> {
  const res = await fetch(`${API_URL}/market/${ticker}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch market');
  return res.json();
}

// Transform raw API response to internal PriceHistory format
function transformRawHistory(raw: RawHistoryResponse): PriceHistory {
  const candles: PriceCandle[] = raw.candlesticks
    .filter(c => c.price.close !== null)
    .map(c => ({
      date: new Date(c.end_period_ts * 1000).toISOString(),
      open: c.price.open ?? c.price.previous ?? 0,
      high: c.price.high ?? c.price.close ?? 0,
      low: c.price.low ?? c.price.close ?? 0,
      close: c.price.close ?? 0,
      volume: c.volume,
    }));

  // Calculate price change (first vs last candle)
  const priceChange30d = candles.length >= 2
    ? candles[candles.length - 1].close - candles[0].close
    : 0;
  const priceChangePct = candles.length >= 2 && candles[0].close !== 0
    ? ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100
    : 0;

  return {
    ticker: raw.ticker,
    title: '',
    days: candles.length,
    candles,
    price_change_30d: priceChange30d,
    price_change_pct: priceChangePct,
  };
}

// Retry wrapper with exponential backoff
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export async function getHistory(ticker: string): Promise<PriceHistory> {
  const res = await fetch(`${API_URL}/history/${ticker}/raw`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch history for ${ticker} (status: ${res.status})`);
  const raw: RawHistoryResponse = await res.json();
  return transformRawHistory(raw);
}

export async function getEstimate(ticker: string): Promise<LLMEstimate> {
  const res = await fetch(`${API_URL}/estimate/${ticker}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch estimate');
  return res.json();
}

// Combined fetch for dashboard - returns markets with their histories
// Retries each history call up to 3 times, only proceeds when all succeed
export async function getMarketsWithHistory(limit = 10): Promise<{ market: MarketSummary; history: PriceHistory }[]> {
  const markets = await getMarkets(limit);
  const marketsToFetch = markets.slice(0, limit);

  // Fetch all histories with retry logic - all must succeed
  const histories = await Promise.all(
    marketsToFetch.map((m) =>
      fetchWithRetry(() => getHistory(m.ticker), 3, 1000)
    )
  );

  return marketsToFetch.map((market, i) => ({ market, history: histories[i] }));
}
