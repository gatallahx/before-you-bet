# Before You Bet - Streamlit UI

A Streamlit frontend for the Before You Bet Kalshi trading analysis API.

## Running the UI

1. **Start the FastAPI backend first:**
   ```bash
   uv run uvicorn main:app --port 8000
   ```

2. **In a new terminal, start the Streamlit frontend:**
   ```bash
   uv run streamlit run ui/app.py
   ```

3. **Open your browser to:**
   ```
   http://localhost:8501
   ```

## Features

- **📊 Markets** - Browse top Kalshi markets by volume
- **🔍 Market Analysis** - View detailed market data and resolution rules
- **🤖 AI Estimate** - Get AI-powered probability estimates with web search
- **📈 Price History** - Interactive candlestick charts with volume
- **🧮 Decision Metrics** - Calculate alpha, EV, and Kelly criterion

## Requirements

Make sure the FastAPI backend is running on `localhost:8000` before using the UI.

