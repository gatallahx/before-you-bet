from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class MarketData(BaseModel):
    """Market data from Kalshi API."""

    ticker: str = Field(..., description="Market ticker symbol")
    title: str = Field(..., description="Title/name of the trade")
    rules_primary: str = Field(default="", description="Primary rules for market resolution")
    rules_secondary: str = Field(default="", description="Secondary rules for market resolution")
    best_ask_yes: float = Field(..., description="Best ask price for YES in cents")
    best_bid_yes: float = Field(..., description="Best bid price for YES in cents")
    volume: int = Field(..., description="Total trading volume")
    open_interest: int = Field(..., description="Open interest (number of open contracts)")
    close_time: datetime = Field(..., description="Market close time")
    expiration_date: datetime = Field(..., description="Market expiration/settlement date")


class MarketSummary(BaseModel):
    """Summary of a market for listing."""

    ticker: str = Field(..., description="Market ticker symbol")
    title: str = Field(..., description="Title/name of the trade")
    yes_ask: float = Field(..., description="Best ask price for YES in cents")
    yes_bid: float = Field(..., description="Best bid price for YES in cents")
    volume: int = Field(..., description="Total trading volume")
    open_interest: int = Field(..., description="Open interest")
    close_time: datetime = Field(..., description="Market close time")
    expiration_date: datetime = Field(..., description="Market expiration/settlement date")


class DecisionMetrics(BaseModel):
    """Computed trading decision metrics."""

    spread_cost: float = Field(..., description="Bid-ask spread in cents")
    true_probability: float = Field(..., description="Estimated true probability (0-1)")
    alpha: float = Field(..., description="Edge over market price in percentage points")
    expected_value: float = Field(..., description="Expected value in cents per contract")
    kelly_percentage: float = Field(..., description="Kelly criterion bet size as percentage of bankroll")


class MarketAnalysis(BaseModel):
    """Complete market analysis including data and metrics."""

    market_data: MarketData
    decision_metrics: DecisionMetrics


class MarketRequest(BaseModel):
    """Request model for market analysis."""

    ticker: str = Field(..., description="Market ticker to analyze")
    true_prob: float = Field(..., ge=0, le=1, description="Your estimated true probability (0-1)")


class LLMEstimate(BaseModel):
    """LLM probability estimation response."""

    probability: float = Field(..., ge=0, le=1, description="Estimated probability (0-1)")
    analysis: str = Field(..., description="Detailed analysis of the market")
    key_takeaways: list[str] = Field(..., description="Key takeaways from the analysis")
    risks: list[str] = Field(..., description="Key risks to consider")
    reasoning: str = Field(..., description="LLM reasoning for the probability estimate")


class GradientPrediction(BaseModel):
    """Gradient AI prediction based on historical data."""

    predicted_price: float = Field(..., description="Predicted next-day price in cents")
    confidence: float = Field(..., ge=0, le=1, description="Confidence level (0-1)")
    trend: str = Field(..., description="Predicted trend: 'up', 'down', or 'neutral'")
    reasoning: str = Field(..., description="Reasoning for the prediction")


class CombinedEstimate(BaseModel):
    """Combined estimate from both AI models."""

    # OpenAI web search estimate
    probability: float = Field(..., ge=0, le=1, description="Estimated probability (0-1)")
    analysis: str = Field(..., description="Detailed analysis of the market")
    key_takeaways: list[str] = Field(..., description="Key takeaways from the analysis")
    risks: list[str] = Field(..., description="Key risks to consider")
    reasoning: str = Field(..., description="LLM reasoning for the probability estimate")

    # Gradient AI historical prediction (None if market closes within 24 hours)
    gradient_prediction: Optional[GradientPrediction] = Field(
        default=None,
        description="Gradient AI prediction based on historical data (None if market closes soon)"
    )


class PriceCandle(BaseModel):
    """Single candlestick/price data point."""

    date: datetime = Field(..., description="Date/time for this candle")
    open: float = Field(..., description="Opening price in cents")
    high: float = Field(..., description="Highest price in cents")
    low: float = Field(..., description="Lowest price in cents")
    close: float = Field(..., description="Closing price in cents")
    volume: int = Field(..., description="Volume traded during this period")


class PriceHistory(BaseModel):
    """Historical price data for a market."""

    ticker: str = Field(..., description="Market ticker symbol")
    title: str = Field(..., description="Market title")
    days: int = Field(..., description="Number of days of history")
    candles: list[PriceCandle] = Field(..., description="Daily price candles")
    price_change_30d: float = Field(..., description="Price change over period in cents")
    price_change_pct: float = Field(..., description="Price change percentage")


