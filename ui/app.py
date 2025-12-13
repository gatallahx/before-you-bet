"""Streamlit frontend for Before You Bet API."""

import streamlit as st
import requests
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"

st.set_page_config(
    page_title="Before You Bet",
    page_icon="🎲",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .big-font {
        font-size: 24px !important;
        font-weight: bold;
    }
    .metric-card {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 20px;
        margin: 10px 0;
    }
    .positive {
        color: #00c853;
    }
    .negative {
        color: #ff1744;
    }
</style>
""", unsafe_allow_html=True)


def check_api_health():
    """Check if API is running."""
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        return response.status_code == 200
    except:
        return False


def get_markets(limit: int = 20):
    """Fetch markets from API."""
    try:
        response = requests.get(f"{API_BASE_URL}/markets", params={"limit": limit}, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Error fetching markets: {e}")
        return []


def get_market_data(ticker: str):
    """Fetch single market data."""
    try:
        response = requests.get(f"{API_BASE_URL}/market/{ticker}", timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Error fetching market data: {e}")
        return None


def get_price_history(ticker: str, days: int = 30):
    """Fetch price history."""
    try:
        response = requests.get(f"{API_BASE_URL}/history/{ticker}", params={"days": days}, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Error fetching history: {e}")
        return None


def get_estimate(ticker: str):
    """Get AI probability estimate."""
    try:
        response = requests.get(f"{API_BASE_URL}/estimate/{ticker}", timeout=120)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Error getting estimate: {e}")
        return None


def get_metrics(ticker: str, true_prob: float):
    """Get decision metrics."""
    try:
        response = requests.get(
            f"{API_BASE_URL}/metrics/{ticker}",
            params={"true_prob": true_prob},
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Error getting metrics: {e}")
        return None


def plot_price_chart(history_data):
    """Create price chart with Plotly."""
    if not history_data or not history_data.get("candles"):
        return None

    candles = history_data["candles"]
    df = pd.DataFrame(candles)
    df["date"] = pd.to_datetime(df["date"])

    fig = go.Figure()

    # Candlestick chart
    fig.add_trace(go.Candlestick(
        x=df["date"],
        open=df["open"],
        high=df["high"],
        low=df["low"],
        close=df["close"],
        name="Price"
    ))

    # Volume bars
    fig.add_trace(go.Bar(
        x=df["date"],
        y=df["volume"],
        name="Volume",
        yaxis="y2",
        opacity=0.3,
        marker_color="blue"
    ))

    fig.update_layout(
        title=f"Price History - {history_data['title']}",
        yaxis_title="Price (cents)",
        yaxis2=dict(
            title="Volume",
            overlaying="y",
            side="right",
            showgrid=False
        ),
        xaxis_rangeslider_visible=False,
        height=500
    )

    return fig


# Sidebar
st.sidebar.title("🎲 Before You Bet")
st.sidebar.markdown("---")

# API Health Check
if check_api_health():
    st.sidebar.success("✅ API Connected")
else:
    st.sidebar.error("❌ API Not Available")
    st.sidebar.info("Start the API with:\n`uv run uvicorn main:app --port 8000`")

# Navigation
page = st.sidebar.radio(
    "Navigate",
    ["📊 Markets", "🔍 Market Analysis", "🤖 AI Estimate", "📈 Price History", "🧮 Decision Metrics"]
)

st.sidebar.markdown("---")
st.sidebar.markdown("### Quick Links")
st.sidebar.markdown(f"[API Docs]({API_BASE_URL}/docs)")

# Main Content
if page == "📊 Markets":
    st.title("📊 Top Markets")
    st.markdown("Browse the most active Kalshi prediction markets.")

    col1, col2 = st.columns([3, 1])
    with col2:
        limit = st.slider("Number of markets", 5, 100, 20)

    with st.spinner("Loading markets..."):
        markets = get_markets(limit)

    if markets:
        # Convert to DataFrame
        df = pd.DataFrame(markets)
        df["close_time"] = pd.to_datetime(df["close_time"])
        df["implied_prob"] = (df["yes_ask"] + df["yes_bid"]) / 2

        # Display as table
        st.dataframe(
            df[["ticker", "title", "yes_bid", "yes_ask", "volume", "open_interest", "close_time"]].rename(columns={
                "ticker": "Ticker",
                "title": "Market",
                "yes_bid": "Bid (¢)",
                "yes_ask": "Ask (¢)",
                "volume": "Volume",
                "open_interest": "Open Interest",
                "close_time": "Close Time"
            }),
            use_container_width=True,
            hide_index=True
        )

        # Quick stats
        st.markdown("### Quick Stats")
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Markets", len(markets))
        col2.metric("Avg Volume", f"{df['volume'].mean():,.0f}")
        col3.metric("Avg Spread", f"{(df['yes_ask'] - df['yes_bid']).mean():.1f}¢")


elif page == "🔍 Market Analysis":
    st.title("🔍 Market Analysis")
    st.markdown("Get detailed information about a specific market.")

    ticker = st.text_input("Enter Market Ticker", placeholder="e.g., KXELONMARS-99")

    if ticker:
        with st.spinner("Fetching market data..."):
            market = get_market_data(ticker)

        if market:
            st.markdown(f"## {market['title']}")

            # Price info
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Best Bid (YES)", f"{market['best_bid_yes']}¢")
            col2.metric("Best Ask (YES)", f"{market['best_ask_yes']}¢")
            col3.metric("Volume", f"{market['volume']:,}")
            col4.metric("Open Interest", f"{market['open_interest']:,}")

            # Implied probability
            mid_price = (market['best_bid_yes'] + market['best_ask_yes']) / 2
            st.metric("Implied Probability", f"{mid_price:.1f}%")

            # Market rules
            with st.expander("📜 Resolution Rules"):
                if market.get("rules_primary"):
                    st.markdown("**Primary Rules:**")
                    st.markdown(market["rules_primary"])
                if market.get("rules_secondary"):
                    st.markdown("**Secondary Rules:**")
                    st.markdown(market["rules_secondary"])

            # Timestamps
            st.markdown("### Timeline")
            col1, col2 = st.columns(2)
            col1.info(f"**Close Time:** {market['close_time']}")
            col2.info(f"**Expiration:** {market['expiration_date']}")


elif page == "🤖 AI Estimate":
    st.title("🤖 AI Probability Estimate")
    st.markdown("Get AI-powered probability estimates using web search and historical analysis.")

    ticker = st.text_input("Enter Market Ticker", placeholder="e.g., KXELONMARS-99", key="ai_ticker")

    if ticker:
        if st.button("🚀 Get AI Estimate", type="primary"):
            with st.spinner("Running AI analysis (this may take 30-60 seconds)..."):
                estimate = get_estimate(ticker)

            if estimate:
                st.success("Analysis complete!")

                # Main probability
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown("### 🎯 Estimated Probability")
                    prob = estimate["probability"]
                    st.markdown(f"<h1 style='text-align: center; color: {'#00c853' if prob > 0.5 else '#ff1744'};'>{prob:.1%}</h1>", unsafe_allow_html=True)

                with col2:
                    # Next-day prediction
                    if estimate.get("gradient_prediction"):
                        pred = estimate["gradient_prediction"]
                        st.markdown("### 📈 Next-Day Prediction")
                        trend_emoji = "🟢" if pred["trend"] == "up" else "🔴" if pred["trend"] == "down" else "⚪"
                        st.metric(
                            "Predicted Price",
                            f"{pred['predicted_price']:.1f}¢",
                            delta=f"{trend_emoji} {pred['trend'].upper()}"
                        )
                        st.caption(f"Confidence: {pred['confidence']:.0%}")
                    else:
                        st.info("No next-day prediction (market closes within 24 hours)")

                # Analysis
                st.markdown("### 📝 Analysis")
                st.markdown(estimate["analysis"])

                # Key takeaways
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown("### ✅ Key Takeaways")
                    for takeaway in estimate.get("key_takeaways", []):
                        st.markdown(f"- {takeaway}")

                with col2:
                    st.markdown("### ⚠️ Risks")
                    for risk in estimate.get("risks", []):
                        st.markdown(f"- {risk}")

                # Reasoning
                with st.expander("💭 Full Reasoning"):
                    st.markdown(estimate.get("reasoning", ""))

                # Prediction reasoning
                if estimate.get("gradient_prediction"):
                    with st.expander("📊 Price Prediction Reasoning"):
                        st.markdown(estimate["gradient_prediction"].get("reasoning", ""))


elif page == "📈 Price History":
    st.title("📈 Price History")
    st.markdown("View historical price data and charts.")

    col1, col2 = st.columns([3, 1])
    with col1:
        ticker = st.text_input("Enter Market Ticker", placeholder="e.g., KXELONMARS-99", key="history_ticker")
    with col2:
        days = st.slider("Days of history", 7, 365, 30)

    if ticker:
        with st.spinner("Loading price history..."):
            history = get_price_history(ticker, days)

        if history:
            st.markdown(f"## {history['title']}")

            # Summary metrics
            col1, col2, col3 = st.columns(3)
            col1.metric("Period", f"{history['days']} days")

            change = history.get("price_change_30d", 0)
            change_pct = history.get("price_change_pct", 0)
            col2.metric("Price Change", f"{change:+.1f}¢", delta=f"{change_pct:+.1f}%")

            if history.get("candles"):
                current_price = history["candles"][-1]["close"]
                col3.metric("Current Price", f"{current_price:.1f}¢")

            # Chart
            fig = plot_price_chart(history)
            if fig:
                st.plotly_chart(fig, use_container_width=True)

            # Data table
            with st.expander("📊 Raw Data"):
                if history.get("candles"):
                    df = pd.DataFrame(history["candles"])
                    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
                    st.dataframe(df, use_container_width=True, hide_index=True)


elif page == "🧮 Decision Metrics":
    st.title("🧮 Decision Metrics Calculator")
    st.markdown("Calculate trading metrics based on your probability estimate.")

    col1, col2 = st.columns(2)

    with col1:
        ticker = st.text_input("Enter Market Ticker", placeholder="e.g., KXELONMARS-99", key="metrics_ticker")

    with col2:
        true_prob = st.slider("Your Estimated Probability", 0.0, 1.0, 0.5, 0.01)

    if ticker:
        # First get market data to show current prices
        with st.spinner("Loading market data..."):
            market = get_market_data(ticker)

        if market:
            st.markdown(f"### {market['title']}")

            col1, col2 = st.columns(2)
            with col1:
                st.info(f"**Market Bid:** {market['best_bid_yes']}¢")
            with col2:
                st.info(f"**Market Ask:** {market['best_ask_yes']}¢")

            implied = (market['best_bid_yes'] + market['best_ask_yes']) / 2
            st.markdown(f"**Implied Probability:** {implied:.1f}%")
            st.markdown(f"**Your Estimate:** {true_prob:.1%}")

            if st.button("📊 Calculate Metrics", type="primary"):
                with st.spinner("Calculating..."):
                    metrics = get_metrics(ticker, true_prob)

                if metrics:
                    st.markdown("---")
                    st.markdown("### Results")

                    col1, col2, col3 = st.columns(3)

                    col1.metric("Spread Cost", f"{metrics['spread_cost']:.1f}¢")

                    alpha = metrics["alpha"]
                    col2.metric(
                        "Alpha (Edge)",
                        f"{alpha:+.1f}%",
                        delta="Positive edge" if alpha > 0 else "Negative edge"
                    )

                    ev = metrics["expected_value"]
                    col3.metric(
                        "Expected Value",
                        f"{ev:+.2f}¢",
                        delta="per contract"
                    )

                    st.markdown("---")

                    kelly = metrics["kelly_percentage"]
                    st.metric("Kelly Criterion", f"{kelly:.2%}", help="Optimal bet size as % of bankroll")

                    # Recommendation
                    if alpha > 0 and ev > 0:
                        st.success(f"✅ **Recommendation:** Consider BUYING YES (Edge: {alpha:.1f}%)")
                    elif alpha < -5:
                        st.warning(f"⚠️ **Recommendation:** Consider BUYING NO or avoid (Edge: {alpha:.1f}%)")
                    else:
                        st.info("ℹ️ **Recommendation:** Marginal opportunity - proceed with caution")


# Footer
st.sidebar.markdown("---")
st.sidebar.caption("Before You Bet © 2024")

