export interface HistoryPoint {
  timestamp: number;
  price: number;
}

export interface Risk {
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Source {
  title: string;
  url: string;
  relevance: string;
}

export interface ProcessedEvent {
  event_ticker: string;
  market_ticker: string;
  event_title: string;
  market_title: string;
  category: string | null;
  current_yes_price: number | null;
  yes_bid: number | null;
  yes_ask: number | null;
  volume_24h: number | null;
  open_interest: number | null;
  close_time: string | null;
  expiration_time: string | null;
  historicals: HistoryPoint[];
  sentiment_score: number;
  analysis: string;
  predicted_outcome: 'YES' | 'NO' | 'UNCERTAIN';
  confidence: number;
  summary: string;
  tldr: string;
  key_takeaways: string[];
  risks: Risk[];
  sources: Source[];
}

export interface AnalyzeResponse {
  success: boolean;
  count: number;
  markets: ProcessedEvent[];
}
