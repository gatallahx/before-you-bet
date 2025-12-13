import { MarketSummary, MarketData, PriceHistory, LLMEstimate } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getMarkets(limit = 100): Promise<MarketSummary[]> {
  const res = await fetch(`${API_URL}/markets?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch markets');
  return res.json();
}

export async function getMarket(ticker: string): Promise<MarketData> {
  const res = await fetch(`${API_URL}/market/${ticker}`);
  if (!res.ok) throw new Error('Failed to fetch market');
  return res.json();
}

export async function getHistory(ticker: string, days = 30): Promise<PriceHistory> {
  const res = await fetch(`${API_URL}/history/${ticker}?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getEstimate(ticker: string): Promise<LLMEstimate> {
  const res = await fetch(`${API_URL}/estimate/${ticker}`);
  if (!res.ok) throw new Error('Failed to fetch estimate');
  return res.json();
}

// Combined fetch for dashboard - returns markets with their histories
export async function getMarketsWithHistory(limit = 10): Promise<{ market: MarketSummary; history: PriceHistory }[]> {
  const markets = await getMarkets(limit);
  const histories = await Promise.all(
    markets.slice(0, limit).map((m) => getHistory(m.ticker))
  );
  return markets.slice(0, limit).map((market, i) => ({ market, history: histories[i] }));
}
