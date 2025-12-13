# Before You Bet

Kalshi trading analysis API with decision metrics.

## Setup

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Configure environment:**
   
   Copy `.env.example` to `.env` and fill in your Kalshi credentials:
   ```bash
   cp .env.example .env
   ```
   
   Required environment variables:
   - `KALSHI_API_KEY`: Your Kalshi API key ID
   - `KALSHI_PRIVATE_KEY_BASE64`: Base64-encoded RSA private key
   
   To encode your RSA private key to base64:
   ```bash
   base64 -i your_private_key.pem | tr -d '\n'
   ```

3. **Run the server:**
   ```bash
   uvicorn main:app --reload
   ```

4. **Visit your API:**
   - Health check: http://127.0.0.1:8000/
   - Interactive docs: http://127.0.0.1:8000/docs

## API Endpoints

### GET /market/{ticker}
Fetch market data for a Kalshi ticker.

**Response:**
- `ticker`: Market ticker symbol
- `best_ask_yes`: Best ask price for YES (cents)
- `best_bid_yes`: Best bid price for YES (cents)
- `volume`: Total trading volume
- `open_interest`: Open interest
- `expiration_date`: Market expiration date

### GET /analyze/{ticker}?true_prob={0.0-1.0}
Get full market analysis with decision metrics.

**Query Parameters:**
- `true_prob`: Your estimated true probability (0.0 to 1.0)

**Response includes:**
- Market data (as above)
- Decision metrics:
  - `spread_cost`: Bid-ask spread in cents
  - `true_probability`: Your input estimate
  - `alpha`: Edge over market (percentage points)
  - `expected_value`: EV per contract in cents
  - `kelly_percentage`: Optimal bet size as % of bankroll

### GET /metrics/{ticker}?true_prob={0.0-1.0}
Get only decision metrics (without full market data).

## Project Structure

```
before-you-bet/
├── main.py              # FastAPI app entry point
├── config.py            # Pydantic settings configuration
├── pyproject.toml       # Project dependencies
├── .env                 # Environment variables (create from .env.example)
└── src/
    ├── models.py        # Pydantic data models
    ├── kalshi_client.py # Kalshi API client with RSA auth
    └── calcuations.py   # Decision metrics calculations
```

## Decision Metrics Explained

- **Spread Cost**: The bid-ask spread represents the transaction cost
- **Alpha**: Your edge over the market's implied probability
- **Expected Value (EV)**: Expected profit/loss per contract in cents
- **Kelly %**: Optimal fraction of bankroll to bet based on Kelly Criterion
