import { AnalyzeResponse, ProcessedEvent } from './types';
import { getMarketsForChart, getMarketsForList } from './mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Flag to use mock data (set to false when backend is ready)
const USE_MOCK_DATA = true;

export async function analyzeMarkets(urls: string[]): Promise<AnalyzeResponse> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const markets = getMarketsForList(urls.length || 20);
    return {
      success: true,
      count: markets.length,
      markets,
    };
  }

  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }

  return response.json();
}

export async function getTrendingMarkets(count: number = 20): Promise<ProcessedEvent[]> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMarketsForList(count);
  }

  // TODO: Implement when backend has trending endpoint
  const response = await fetch(`${API_URL}/markets/trending?count=${count}`);

  if (!response.ok) {
    throw new Error('Failed to fetch trending markets');
  }

  const data = await response.json();
  return data.markets;
}

export async function getMarketsWithHistory(count: number = 10): Promise<ProcessedEvent[]> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMarketsForChart(count);
  }

  // TODO: Implement when backend has historical data endpoint
  const response = await fetch(`${API_URL}/markets/chart?count=${count}`);

  if (!response.ok) {
    throw new Error('Failed to fetch market history');
  }

  const data = await response.json();
  return data.markets;
}
