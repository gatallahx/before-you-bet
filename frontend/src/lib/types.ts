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

// Match backend LLMEstimate exactly
export interface LLMEstimate {
  probability: number;
  analysis: string;
  key_takeaways: string[];
  risks: string[]; // Plain strings only
  reasoning: string;
}
