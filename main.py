"""FastAPI application for Kalshi trading analysis."""

import asyncio
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query

from src.llm_client import llm_client, prediction_client
from src.models import MarketData, MarketAnalysis, DecisionMetrics, LLMEstimate, MarketSummary, PriceHistory, PriceCandle, CombinedEstimate, GradientPrediction
from src.kalshi_client import kalshi_client
from src.calcuations import calculate_decision_metrics

app = FastAPI(
    title="Before You Bet",
    description="Kalshi trading analysis API with decision metrics",
    version="0.1.0"
)


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Before You Bet API"}


@app.get("/markets", response_model=list[MarketSummary])
async def get_top_markets(
    limit: int = Query(default=100, ge=1, le=100, description="Number of markets to return")
):
    """
    Get the top markets from Kalshi.

    Returns a list of open markets sorted by volume.
    """
    try:
        response = await kalshi_client.get_markets(limit=limit, status="open")
        markets = response.get("markets", [])

        # Sort by volume descending
        markets_sorted = sorted(markets, key=lambda m: m.get("volume", 0), reverse=True)

        result = []
        for m in markets_sorted[:limit]:
            # Parse close time
            close_time = m.get("close_time")
            if close_time:
                if isinstance(close_time, str):
                    close_time_dt = datetime.fromisoformat(close_time.replace("Z", "+00:00"))
                else:
                    close_time_dt = datetime.fromtimestamp(close_time)
            else:
                close_time_dt = datetime.now()

            # Parse expiration date
            expiration_time = m.get("expiration_time") or m.get("close_time")
            if expiration_time:
                if isinstance(expiration_time, str):
                    expiration_date = datetime.fromisoformat(expiration_time.replace("Z", "+00:00"))
                else:
                    expiration_date = datetime.fromtimestamp(expiration_time)
            else:
                expiration_date = datetime.now()

            result.append(MarketSummary(
                ticker=m.get("ticker", ""),
                title=m.get("title", ""),
                yes_ask=m.get("yes_ask", 0),
                yes_bid=m.get("yes_bid", 0),
                volume=m.get("volume", 0),
                open_interest=m.get("open_interest", 0),
                close_time=close_time_dt,
                expiration_date=expiration_date
            ))

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching markets: {str(e)}")


@app.get("/market/{ticker}", response_model=MarketData)
async def get_market_data(ticker: str):
    """
    Fetch market data for a given Kalshi ticker.

    Returns best ask/bid for YES, volume, open interest, and expiration date.
    """
    try:
        market_data, orderbook_data = await kalshi_client.get_market_with_orderbook(ticker)

        market_info = market_data.get("market", {})
        orderbook = orderbook_data.get("orderbook", {})

        # Extract best ask for YES (lowest sell price)
        yes_asks = orderbook.get("yes", [])
        # Extract best bid for YES (highest buy price)
        # Note: In Kalshi orderbook, "no" side buying is equivalent to selling YES
        no_bids = orderbook.get("no", [])

        # Best ask for YES: lowest price someone will sell YES at
        best_ask_yes = float(yes_asks[0][0]) if yes_asks else market_info.get("yes_ask", 0)

        # Best bid for YES: 100 - best ask for NO (since YES + NO = 100)
        best_bid_yes = 100 - float(no_bids[0][0]) if no_bids else market_info.get("yes_bid", 0)

        # Parse expiration date
        close_time = market_info.get("close_time") or market_info.get("expiration_time")
        if close_time:
            if isinstance(close_time, str):
                # Handle ISO format with or without timezone
                close_time_dt = datetime.fromisoformat(close_time.replace("Z", "+00:00"))
            else:
                close_time_dt = datetime.fromtimestamp(close_time)
        else:
            close_time_dt = datetime.now()

        # Parse expiration/settlement date
        expiration_time = market_info.get("expiration_time") or market_info.get("close_time")
        if expiration_time:
            if isinstance(expiration_time, str):
                expiration_date = datetime.fromisoformat(expiration_time.replace("Z", "+00:00"))
            else:
                expiration_date = datetime.fromtimestamp(expiration_time)
        else:
            expiration_date = datetime.now()

        return MarketData(
            ticker=ticker,
            title=market_info.get("title", ""),
            rules_primary=market_info.get("rules_primary", ""),
            rules_secondary=market_info.get("rules_secondary", ""),
            best_ask_yes=best_ask_yes,
            best_bid_yes=best_bid_yes,
            volume=market_info.get("volume", 0),
            open_interest=market_info.get("open_interest", 0),
            close_time=close_time_dt,
            expiration_date=expiration_date
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market data: {str(e)}")


@app.get("/analyze/{ticker}", response_model=MarketAnalysis)
async def analyze_market(
    ticker: str,
    true_prob: float = Query(
        ...,
        ge=0,
        le=1,
        description="Your estimated true probability (0.0 to 1.0)"
    )
):
    """
    Analyze a market with decision metrics.

    Computes:
    - Spread cost: bid-ask spread in cents
    - True probability: your input estimate
    - Alpha: edge over market (percentage points)
    - Expected value: EV per contract in cents
    - Kelly percentage: optimal bet size as % of bankroll
    """
    # Get market data
    market_data = await get_market_data(ticker)

    # Calculate decision metrics
    metrics = calculate_decision_metrics(market_data, true_prob)

    return MarketAnalysis(
        market_data=market_data,
        decision_metrics=metrics
    )


@app.get("/metrics/{ticker}", response_model=DecisionMetrics)
async def get_metrics_only(
    ticker: str,
    true_prob: float = Query(
        ...,
        ge=0,
        le=1,
        description="Your estimated true probability (0.0 to 1.0)"
    )
):
    """Get only the decision metrics for a market (without full market data)."""
    market_data = await get_market_data(ticker)
    return calculate_decision_metrics(market_data, true_prob)


@app.get("/estimate/{ticker}", response_model=CombinedEstimate)
async def estimate_probability(ticker: str):
    """
    Use LLM with web search to estimate the true probability for a market,
    and Gradient AI to predict next-day price from historical data.

    Both AI calls run in parallel for faster response.

    Returns:
    - probability: Estimated true probability (0-1) from OpenAI
    - analysis: Detailed analysis of the market
    - key_takeaways: Key insights from the research
    - risks: Key risks to consider
    - reasoning: Explanation of the probability estimate
    - gradient_prediction: Next-day price prediction from Gradient AI (None if market closes within 24 hours)
    """
    try:
        # Get market data and raw history
        market_data = await get_market_data(ticker)
        raw_history = await kalshi_client.get_market_history(ticker, days=30)

        # Run both AI calls in parallel
        openai_task = llm_client.estimate_probability(market_data)
        prediction_task = prediction_client.predict_from_history(
            raw_history=raw_history,
            title=market_data.title,
            ticker=ticker,
            close_time=market_data.close_time
        )

        openai_result, prediction_result = await asyncio.gather(
            openai_task,
            prediction_task
        )

        # Build gradient prediction (None if market closes within 24 hours)
        gradient_prediction = None
        if prediction_result is not None:
            gradient_prediction = GradientPrediction(
                predicted_price=prediction_result["predicted_price"],
                confidence=prediction_result["confidence"],
                trend=prediction_result["trend"],
                reasoning=prediction_result["reasoning"]
            )

        return CombinedEstimate(
            probability=openai_result["probability"],
            analysis=openai_result["analysis"],
            key_takeaways=openai_result["key_takeaways"],
            risks=openai_result["risks"],
            reasoning=openai_result["reasoning"],
            gradient_prediction=gradient_prediction
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error estimating probability: {str(e)}")


@app.get("/history/{ticker}", response_model=PriceHistory)
async def get_price_history(
    ticker: str,
    days: int = Query(default=30, ge=1, le=365, description="Number of days of history")
):
    """
    Get historical price data for a market.

    Returns daily candlestick data (OHLC + volume) for the past N days.
    """
    try:
        # Get market info for title
        market_data, _ = await kalshi_client.get_market_with_orderbook(ticker)
        market_info = market_data.get("market", {})
        title = market_info.get("title", "")

        # Get historical candlestick data
        history = await kalshi_client.get_market_history(ticker, days=days)

        candles_data = history.get("candlesticks", [])

        def extract_price(candle: dict, *field_names) -> float:
            """Extract numeric price from candle, trying multiple field names."""
            for field in field_names:
                value = candle.get(field)
                if value is None:
                    continue
                if isinstance(value, (int, float)):
                    return float(value)
                if isinstance(value, dict):
                    # Kalshi sometimes returns nested dicts like {'close': 10, 'close_dollars': '0.1000'}
                    # Try to get the cents value first (look for numeric values)
                    for key in ['price', 'cents', field, 'value']:
                        if key in value and isinstance(value[key], (int, float)):
                            return float(value[key])
                    # Fallback: try any numeric value in the dict
                    for v in value.values():
                        if isinstance(v, (int, float)):
                            return float(v)
            return 0.0

        # Parse candles
        candles = []
        for c in candles_data:
            # Kalshi returns timestamps in seconds
            ts = c.get("end_period_ts") or c.get("start_period_ts") or c.get("ts")
            if ts:
                candle_date = datetime.fromtimestamp(ts)
            else:
                continue

            # Extract OHLC prices - try multiple possible field names
            open_price = extract_price(c, "open", "open_price", "yes_open", "price_open", "open_yes")
            high_price = extract_price(c, "high", "high_price", "yes_high", "price_high", "high_yes")
            low_price = extract_price(c, "low", "low_price", "yes_low", "price_low", "low_yes")
            close_price = extract_price(c, "close", "close_price", "yes_close", "price_close", "close_yes", "price", "yes_price")

            # If open/high/low are missing but close exists, use close as fallback
            if close_price > 0:
                if open_price == 0:
                    open_price = close_price
                if high_price == 0:
                    high_price = close_price
                if low_price == 0:
                    low_price = close_price

            candles.append(PriceCandle(
                date=candle_date,
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
                volume=c.get("volume", 0)
            ))

        # Sort by date ascending
        candles.sort(key=lambda x: x.date)

        # Calculate price change
        if len(candles) >= 2:
            first_price = candles[0].close
            last_price = candles[-1].close
            price_change = last_price - first_price
            price_change_pct = (price_change / first_price * 100) if first_price > 0 else 0
        else:
            price_change = 0
            price_change_pct = 0

        return PriceHistory(
            ticker=ticker,
            title=title,
            days=days,
            candles=candles,
            price_change_30d=price_change,
            price_change_pct=price_change_pct
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching price history: {str(e)}")


@app.get("/history/{ticker}/raw")
async def get_price_history_raw(
    ticker: str,
    days: int = Query(default=30, ge=1, le=365, description="Number of days of history")
):
    """
    Debug endpoint: Get raw candlestick response from Kalshi API.
    """
    try:
        history = await kalshi_client.get_market_history(ticker, days=days)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


