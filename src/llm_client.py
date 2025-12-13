"""OpenAI and Gradient AI LLM clients for probability estimation."""

import json
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field
from openai import OpenAI
from openai.types.chat import ChatCompletionUserMessageParam, ChatCompletionSystemMessageParam
from src.models import MarketData
from config import settings


class ProbabilityEstimate(BaseModel):
    """Structured output schema for probability estimation."""

    probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Estimated probability between 0 and 1"
    )
    analysis: str = Field(
        ...,
        description="Detailed analysis of the market and current situation"
    )
    key_takeaways: list[str] = Field(
        ...,
        description="3-5 key takeaways from the analysis"
    )
    risks: list[str] = Field(
        ...,
        description="3-5 risks that could affect the outcome"
    )
    reasoning: str = Field(
        ...,
        description="Explanation of how the probability was estimated"
    )


class HistoricalPrediction(BaseModel):
    """Structured output for historical data prediction."""

    predicted_price: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Predicted next-day price in cents (0-100)"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence level between 0 and 1"
    )
    trend: str = Field(
        ...,
        description="Predicted trend: 'up', 'down', or 'neutral'"
    )
    reasoning: str = Field(
        ...,
        description="Explanation of the prediction based on historical patterns"
    )


SYSTEM_PROMPT = """You are an expert prediction market analyst and probability estimator. Your job is to analyze prediction market questions and estimate the true probability of the outcome occurring.

You have access to web search to find the latest news, data, and expert opinions. Use this to inform your analysis.

Guidelines:
- Be calibrated: a 70% probability should resolve YES 70% of the time
- Consider base rates and historical precedents
- Account for uncertainty and unknown unknowns
- Be specific about what information influenced your estimate
- Identify the key factors that could change the outcome
- Consider both upside and downside risks
- Provide 3-5 key takeaways and 3-5 risks"""


def build_user_prompt(market: MarketData) -> str:
    """Build the user prompt from market data."""

    # Calculate implied probability from market prices
    implied_prob_ask = market.best_ask_yes / 100
    implied_prob_bid = market.best_bid_yes / 100
    midpoint_prob = (implied_prob_ask + implied_prob_bid) / 2

    # Build rules section
    rules_section = ""
    if market.rules_primary:
        rules_section += f"\n**Primary Resolution Rules:**\n{market.rules_primary}\n"
    if market.rules_secondary:
        rules_section += f"\n**Secondary Resolution Rules:**\n{market.rules_secondary}\n"

    return f"""Analyze this Kalshi prediction market and estimate the TRUE probability of the outcome.

**Market Title:** {market.title}
{rules_section}
**Market Data:**
- Ticker: {market.ticker}
- Best Ask (YES): {market.best_ask_yes}¢ (implied prob: {implied_prob_ask:.1%})
- Best Bid (YES): {market.best_bid_yes}¢ (implied prob: {implied_prob_bid:.1%})
- Market Midpoint: {midpoint_prob:.1%}
- Volume: {market.volume:,} contracts
- Open Interest: {market.open_interest:,} contracts
- Close Time: {market.close_time.strftime('%Y-%m-%d %H:%M UTC')}
- Expiration: {market.expiration_date.strftime('%Y-%m-%d %H:%M UTC')}

**Your Task:**
1. Use web search to find the latest relevant news, data, and expert opinions
2. Carefully consider the resolution rules above when estimating probability
3. Analyze the current situation and key factors affecting this outcome
4. Consider what the market might be missing or mispricing
5. Estimate the TRUE probability (which may differ from the market's implied probability)
6. Identify 3-5 key takeaways and 3-5 risks

Remember: The market's implied probability is ~{midpoint_prob:.1%}. Your job is to determine if this is accurate, too high, or too low based on your research and the specific resolution criteria."""


class LLMClient:
    """Client for OpenAI API with web search capability and structured output."""

    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o-mini-search-preview"

    async def estimate_probability(self, market: MarketData) -> dict:
        """
        Use OpenAI with web search to estimate the true probability
        of a Kalshi market outcome.

        Args:
            market: Full MarketData object from Kalshi

        Returns:
            dict with probability, analysis, key_takeaways, risks, and reasoning
        """
        system_message: ChatCompletionSystemMessageParam = {
            "role": "system",
            "content": SYSTEM_PROMPT
        }

        user_message: ChatCompletionUserMessageParam = {
            "role": "user",
            "content": build_user_prompt(market)
        }

        response = self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[system_message, user_message],
            response_format=ProbabilityEstimate,
            web_search_options={"search_context_size": "high"},  # type: ignore
        )

        parsed = response.choices[0].message.parsed

        if parsed is None:
            # Fallback if parsing fails (e.g., refusal)
            refusal = response.choices[0].message.refusal
            return {
                "probability": 0.5,
                "analysis": "Failed to parse response",
                "key_takeaways": ["Unable to generate structured response"],
                "risks": ["Response parsing failed - please try again"],
                "reasoning": refusal or "Unknown error occurred"
            }

        return {
            "probability": parsed.probability,
            "analysis": parsed.analysis,
            "key_takeaways": parsed.key_takeaways,
            "risks": parsed.risks,
            "reasoning": parsed.reasoning
        }


PREDICTION_SYSTEM_PROMPT = """You are an expert quantitative analyst specializing in prediction market price forecasting. Your job is to analyze historical price data and predict the next day's price movement.

You will be given:
- Historical candlestick data (OHLC + volume) for a prediction market
- The market title and current price

Based on the price patterns, volume trends, momentum, and any technical signals you can identify, predict the next day's price.

Focus on:
- Recent price momentum and direction
- Volume patterns and what they indicate
- Support/resistance levels
- Mean reversion vs trend continuation signals
- Volatility patterns

You MUST respond in this exact JSON format:
{
  "predicted_price": <number between 0-100>,
  "confidence": <number between 0-1>,
  "trend": "<up|down|neutral>",
  "reasoning": "<your explanation>"
}"""


class PredictionClient:
    """Client for OpenAI API for next-day price predictions."""

    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o-mini"

    def _build_history_prompt(self, raw_history: dict, title: str, ticker: str) -> str:
        """Build prompt from raw historical price data."""
        candles_json = json.dumps(raw_history.get("candlesticks", [])[-30:], indent=2)

        return f"""Analyze this prediction market's historical price data and predict tomorrow's price.

**Market:** {title}
**Ticker:** {ticker}

**Raw Historical Candlestick Data (JSON):**
{candles_json}

Based on the price patterns, momentum, and volume trends in the data above, predict tomorrow's price.

Remember to respond in the exact JSON format specified."""

    async def predict_from_history(self, raw_history: dict, title: str, ticker: str, close_time: datetime | None = None) -> dict | None:
        """
        Use OpenAI to predict next-day price from historical data.

        Args:
            raw_history: Raw candlestick data dict from Kalshi API
            title: Market title
            ticker: Market ticker
            close_time: Market close time (if provided, will skip prediction if market closes within 24 hours)

        Returns:
            dict with predicted_price, confidence, trend, and reasoning
            None if market closes within 24 hours (no next-day prediction needed)
        """
        # Check if market closes within the next 24 hours
        if close_time:
            now = datetime.now(timezone.utc)
            if close_time.tzinfo is None:
                close_time = close_time.replace(tzinfo=timezone.utc)

            time_until_close = close_time - now
            if time_until_close <= timedelta(hours=24):
                return None

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": PREDICTION_SYSTEM_PROMPT},
                    {"role": "user", "content": self._build_history_prompt(raw_history, title, ticker)}
                ],
                max_tokens=500
            )

            content = response.choices[0].message.content

            if not content:
                return {
                    "predicted_price": 50,
                    "confidence": 0.1,
                    "trend": "neutral",
                    "reasoning": "OpenAI returned empty response"
                }

            # Extract JSON from markdown if needed
            json_content = content
            if "```json" in content:
                json_content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_content = content.split("```")[1].split("```")[0].strip()

            try:
                parsed = json.loads(json_content)
                return {
                    "predicted_price": float(parsed.get("predicted_price", 50)),
                    "confidence": float(parsed.get("confidence", 0.5)),
                    "trend": str(parsed.get("trend", "neutral")),
                    "reasoning": str(parsed.get("reasoning", "No reasoning provided"))
                }
            except json.JSONDecodeError:
                return {
                    "predicted_price": 50,
                    "confidence": 0.3,
                    "trend": "neutral",
                    "reasoning": f"Could not parse JSON. Raw: {content[:300]}"
                }

        except Exception as e:
            return {
                "predicted_price": 50,
                "confidence": 0.1,
                "trend": "neutral",
                "reasoning": f"Prediction error: {str(e)}"
            }


# Singleton instances
llm_client = LLMClient()
prediction_client = PredictionClient()
