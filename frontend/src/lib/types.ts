// Match backend MarketSummary exactly
export interface MarketSummary {
  ticker: string;
  title: string;
  yes_ask: number;
  yes_bid: number;
  volume: number;
  open_interest: number;
  close_time: string;
  expiration_date: string;
}

// Match backend MarketData exactly
export interface MarketData {
  ticker: string;
  title: string;
  rules_primary: string;
  rules_secondary: string;
  best_ask_yes: number;
  best_bid_yes: number;
  volume: number;
  open_interest: number;
  close_time: string;
  expiration_date: string;
}

// Match backend PriceCandle exactly
export interface PriceCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Match backend PriceHistory exactly
export interface PriceHistory {
  ticker: string;
  title: string;
  days: number;
  candles: PriceCandle[];
  price_change_30d: number;
  price_change_pct: number;
}

// Gradient prediction from LLM analysis
export interface GradientPrediction {
  predicted_price: number;
  confidence: number;
  trend: 'up' | 'down' | 'neutral';
  reasoning: string;
}

// Match backend LLMEstimate exactly
export interface LLMEstimate {
  probability: number;
  analysis: string;
  key_takeaways: string[];
  risks: string[]; // Plain strings only
  reasoning: string;
  gradient_prediction?: GradientPrediction;
}

// Raw API response types for /history/{ticker}/raw
export interface RawPriceData {
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  mean: number | null;
  previous: number | null;
}

export interface RawBidAskData {
  open: number;
  close: number;
  high: number;
  low: number;
}

export interface RawCandlestick {
  end_period_ts: number;
  open_interest: number;
  volume: number;
  price: RawPriceData;
  yes_ask: RawBidAskData;
  yes_bid: RawBidAskData;
}

export interface RawHistoryResponse {
  ticker: string;
  candlesticks: RawCandlestick[];
}
