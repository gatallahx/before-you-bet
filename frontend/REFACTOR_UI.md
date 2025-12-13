# Frontend Conformance to Backend Plan

**Principle: Backend shapes are the source of truth. Frontend conforms to backend, no exceptions.**

---

## Backend Shapes (Source of Truth)

### `/markets` → `MarketSummary[]`
```python
class MarketSummary:
    ticker: str
    title: str
    yes_ask: float
    yes_bid: float
    volume: int
    open_interest: int
    close_time: datetime
    expiration_date: datetime
```

### `/market/{ticker}` → `MarketData`
```python
class MarketData:
    ticker: str
    title: str
    rules_primary: str
    rules_secondary: str
    best_ask_yes: float
    best_bid_yes: float
    volume: int
    open_interest: int
    close_time: datetime
    expiration_date: datetime
```

### `/history/{ticker}` → `PriceHistory`
```python
class PriceCandle:
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int

class PriceHistory:
    ticker: str
    title: str
    days: int
    candles: list[PriceCandle]
    price_change_30d: float
    price_change_pct: float
```

### `/estimate/{ticker}` → `LLMEstimate`
```python
class LLMEstimate:
    probability: float        # 0-1
    analysis: str
    key_takeaways: list[str]
    risks: list[str]          # Plain strings, NO severity/likelihood
    reasoning: str
```

---

## New Frontend Types (`frontend/src/lib/types.ts`)

**REPLACE ALL CURRENT TYPES with these backend-matching types:**

```typescript
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
  risks: string[];           // Plain strings only
  reasoning: string;
}
```

---

## UI Impact Analysis

### NEW Backend Fields to Display

These fields exist in the backend but have **no current UI**. We need to add UI for them:

| Backend Field | Type | Source | UI Location |
|---------------|------|--------|-------------|
| `rules_primary` | string | MarketData | MarketCardExpanded - new "Rules" section or info tooltip |
| `rules_secondary` | string | MarketData | MarketCardExpanded - alongside rules_primary |
| `price_change_30d` | number | PriceHistory | page.tsx - replace manual calculation, show as price delta |
| `price_change_pct` | number | PriceHistory | page.tsx - show as percentage change badge |
| `reasoning` | string | LLMEstimate | MarketCardExpanded - new section in Analysis tab (replaces TL;DR slot) |
| `probability` | number (0-1) | LLMEstimate | MarketCardExpanded - display as percentage, derive prediction badge |

**UI additions needed:**

1. **MarketCardExpanded - Rules Section**
   - Add collapsible "Resolution Rules" section showing `rules_primary` and `rules_secondary`
   - Location: Below header or in a new tab

2. **MarketCardExpanded - Reasoning Section**
   - Replace removed TL;DR section with "AI Reasoning" section
   - Display `estimate.reasoning` text

3. **MarketCardExpanded - Probability Display**
   - Show `probability * 100` as percentage
   - Derive prediction indicator: `probability > 0.6` = YES likely, `< 0.4` = NO likely, else UNCERTAIN

4. **page.tsx - Use Backend Price Changes**
   - Replace manual `lastPrice - firstPrice` calculation with `history.price_change_30d`
   - Add `history.price_change_pct` display (e.g., "+12.5%")

---

### Features Being REMOVED (not in backend):

| Feature | Current Location | Action |
|---------|------------------|--------|
| `category` | MarketCardExpanded header | Remove category display |
| `current_yes_price` | MarketCardExpanded, page.tsx | Calculate: `(yes_bid + yes_ask) / 2` |
| `sentiment_score` | Not used in UI | Remove from types |
| `predicted_outcome` | page.tsx badge | Remove or derive from `probability > 0.5` |
| `confidence` | Not used in UI | Remove from types |
| `summary` | Not used in UI | Remove from types |
| `tldr` | MarketCardExpanded analysis tab | Remove TL;DR section |
| `sources` | MarketCardExpanded sources tab | Remove entire Sources tab |
| `risks[].severity` | MarketCardExpanded risks tab | Show risks as plain text list |
| `risks[].likelihood` | MarketCardExpanded risks tab | Remove badges |
| `event_ticker` | Not used in UI | Remove from types |
| `event_title` | Not used in UI | Remove from types |
| Nested `Candlestick` | Charts | Use flat `PriceCandle` |

### Field Renames:

| Current Frontend | Backend Field | Files Affected |
|-----------------|---------------|----------------|
| `market_ticker` | `ticker` | page.tsx, TimeSeriesChart.tsx |
| `market_title` | `title` | page.tsx, TimeSeriesChart.tsx, MarketCardExpanded.tsx |
| `expiration_time` | `expiration_date` | MarketCardExpanded.tsx |
| `volume_24h` | `volume` | MarketCardExpanded.tsx |
| `historicals` | `candles` (from PriceHistory) | MarketCardExpanded.tsx, TimeSeriesChart.tsx |
| `h.end_period_ts` | `candle.date` | MarketCardExpanded.tsx, TimeSeriesChart.tsx |
| `h.price.close` | `candle.close` | MarketCardExpanded.tsx, TimeSeriesChart.tsx, page.tsx |

---

## Component Changes

### 1. `frontend/src/lib/types.ts`
**Complete rewrite** - Replace all interfaces with backend-matching types above.

### 2. `frontend/src/lib/api.ts`
**Rewrite** to call actual backend endpoints:

```typescript
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
export async function getMarketsWithHistory(limit = 10): Promise<{market: MarketSummary, history: PriceHistory}[]> {
  const markets = await getMarkets(limit);
  const histories = await Promise.all(
    markets.slice(0, limit).map(m => getHistory(m.ticker))
  );
  return markets.slice(0, limit).map((market, i) => ({ market, history: histories[i] }));
}
```

### 3. `frontend/src/app/page.tsx`
**Changes needed:**

| Current Code | New Code |
|--------------|----------|
| `markets: ProcessedEvent[]` | `markets: {market: MarketSummary, history: PriceHistory}[]` |
| `market.market_ticker` | `market.ticker` |
| `market.market_title` | `market.title` |
| `market.current_yes_price` | `(market.yes_bid + market.yes_ask) / 2` |
| `market.historicals[0]?.price.close` | `history.candles[0]?.close` |
| `market.predicted_outcome` | Remove badge OR derive from LLMEstimate.probability |
| Manual `lastPrice - firstPrice` calc | Use `history.price_change_30d` directly |
| Manual `change / firstPrice * 100` calc | Use `history.price_change_pct` directly |

**New data to display:**
- `history.price_change_pct` - show as percentage badge (e.g., "+12.5%")
- Consider adding probability-based indicator if LLMEstimate is fetched

### 4. `frontend/src/components/charts/TimeSeriesChart.tsx`
**Changes needed:**

| Current Code | New Code |
|--------------|----------|
| `markets: ProcessedEvent[]` | `data: {market: MarketSummary, history: PriceHistory}[]` |
| `market.market_ticker` | `market.ticker` |
| `market.market_title` | `market.title` |
| `market.historicals` | `history.candles` |
| `h.end_period_ts * 1000` | `new Date(candle.date).getTime()` |
| `h.price.close` | `candle.close` |

### 5. `frontend/src/components/cards/MarketCardExpanded.tsx`
**Major changes:**

**Props change:**
```typescript
// FROM:
interface MarketCardExpandedProps {
  market: ProcessedEvent;
}

// TO:
interface MarketCardExpandedProps {
  market: MarketSummary | MarketData;
  history: PriceHistory;
  estimate?: LLMEstimate;  // Optional, fetched on demand
}
```

**Removals:**
- Remove `category` display from header
- Remove TL;DR section from analysis tab
- Remove Sources tab entirely (change tabs to just ['analysis', 'risks'])
- Remove severity/likelihood badges from risks
- Display risks as simple bullet list

**Additions (NEW backend fields):**
- Add "Resolution Rules" collapsible section showing `market.rules_primary` and `market.rules_secondary`
- Replace TL;DR with "AI Reasoning" section showing `estimate.reasoning`
- Add probability display: `Math.round(estimate.probability * 100)%` with derived prediction badge
- Show `history.price_change_30d` and `history.price_change_pct` in header/stats

**Tab structure change:**
```typescript
// FROM: ['analysis', 'risks', 'sources']
// TO:   ['analysis', 'risks', 'rules']  // or just ['analysis', 'risks'] with rules in header
```

**Field changes:**
| Current | New |
|---------|-----|
| `market.market_title` | `market.title` |
| `market.current_yes_price` | `(market.yes_bid + market.yes_ask) / 2` |
| `market.volume_24h` | `market.volume` |
| `market.expiration_time` | `market.expiration_date` |
| `market.historicals` | `history.candles` |
| `h.end_period_ts * 1000` | `new Date(candle.date).getTime()` |
| `h.price.close` | `candle.close` |
| `market.tldr` | Replace with `estimate.reasoning` |
| `market.risks[].severity` | Remove - just show `risk` string |
| `market.sources` | Remove tab |
| N/A | Add `market.rules_primary`, `market.rules_secondary` |
| N/A | Add `estimate.probability` → display as % |
| N/A | Add `history.price_change_30d`, `history.price_change_pct` |

### 6. `frontend/src/components/ui/Badge.tsx`
**Remove or simplify:**
- `SeverityBadge` - no longer needed
- `LikelihoodBadge` - no longer needed

### 7. `frontend/src/lib/mock-data.ts`
**Remove entirely** - will use real backend data.

---

## Implementation Order

1. **Update `types.ts`** - Replace all types with backend-matching types
2. **Update `api.ts`** - Implement real API calls
3. **Update `TimeSeriesChart.tsx`** - Adapt to new data structure
4. **Update `page.tsx`** - Adapt to new data structure
5. **Update `MarketCardExpanded.tsx`** - Adapt and remove unsupported features
6. **Clean up** - Remove mock-data.ts, unused Badge components

---

## Files Summary

| File | Action |
|------|--------|
| `frontend/src/lib/types.ts` | **REWRITE** - Backend-matching types only |
| `frontend/src/lib/api.ts` | **REWRITE** - Real API calls |
| `frontend/src/lib/mock-data.ts` | **DELETE** |
| `frontend/src/app/page.tsx` | **UPDATE** - New data structure |
| `frontend/src/components/charts/TimeSeriesChart.tsx` | **UPDATE** - New data structure |
| `frontend/src/components/cards/MarketCardExpanded.tsx` | **UPDATE** - Remove unsupported features |
| `frontend/src/components/ui/Badge.tsx` | **SIMPLIFY** - Remove Severity/Likelihood badges |
