"""Trading decision metrics calculations."""

from src.models import MarketData, DecisionMetrics


def calculate_spread_cost(best_ask: float, best_bid: float) -> float:
    """Calculate bid-ask spread in cents."""
    return best_ask - best_bid


def calculate_alpha(true_prob: float, implied_prob: float) -> float:
    """
    Calculate alpha (edge) as the difference between true probability
    and market-implied probability.

    Returns alpha in percentage points.
    """
    return (true_prob - implied_prob) * 100


def calculate_expected_value(true_prob: float, cost_cents: float) -> float:
    """
    Calculate expected value per contract in cents.

    For Kalshi binary contracts:
    - Win: receive $1 (100 cents)
    - Lose: lose the cost paid

    EV = (prob_win * payout) - (prob_lose * cost)
       = (true_prob * 100) - cost
       = true_prob * 100 - cost (since we pay cost and get 100 if win)

    Simplified: EV = true_prob * (100 - cost) - (1 - true_prob) * cost
                   = true_prob * 100 - true_prob * cost - cost + true_prob * cost
                   = true_prob * 100 - cost
    """
    return (true_prob * 100) - cost_cents


def calculate_kelly_percentage(true_prob: float, cost_cents: float) -> float:
    """
    Calculate Kelly Criterion optimal bet size.

    Kelly formula: f* = (bp - q) / b
    where:
        b = net odds received on the wager (payout/cost - 1)
        p = probability of winning
        q = probability of losing (1 - p)

    For Kalshi: cost is in cents, payout is 100 cents
        b = (100 / cost) - 1

    Returns Kelly percentage (0-100).
    """
    if cost_cents <= 0 or cost_cents >= 100:
        return 0.0

    # Net odds: how much you win per dollar risked
    b = (100 / cost_cents) - 1
    p = true_prob
    q = 1 - true_prob

    kelly = (b * p - q) / b

    # Clamp to valid range [0, 1] and convert to percentage
    kelly = max(0.0, min(kelly, 1.0))
    return kelly * 100


def calculate_decision_metrics(
    market_data: MarketData,
    true_prob: float
) -> DecisionMetrics:
    """
    Calculate all trading decision metrics for a market.

    Args:
        market_data: Market data including best ask/bid
        true_prob: User's estimated true probability (0-1)

    Returns:
        DecisionMetrics with all calculated values
    """
    # Spread cost
    spread_cost = calculate_spread_cost(
        market_data.best_ask_yes,
        market_data.best_bid_yes
    )

    # Implied probability from best ask (cost to buy YES)
    implied_prob = market_data.best_ask_yes / 100

    # Alpha (edge)
    alpha = calculate_alpha(true_prob, implied_prob)

    # Expected value
    ev = calculate_expected_value(true_prob, market_data.best_ask_yes)

    # Kelly percentage
    kelly = calculate_kelly_percentage(true_prob, market_data.best_ask_yes)

    return DecisionMetrics(
        spread_cost=spread_cost,
        true_probability=true_prob,
        alpha=alpha,
        expected_value=ev,
        kelly_percentage=kelly
    )

