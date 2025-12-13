import time
import base64
from datetime import datetime, timedelta
import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

from config import settings


class KalshiClient:

    def __init__(self):
        self.base_url = settings.kalshi_base_url
        self.api_key = settings.kalshi_api_key
        self.private_key = self._load_private_key()

    def _load_private_key(self):
        key_pem = settings.get_private_key_pem()
        return serialization.load_pem_private_key(
            key_pem.encode(),
            password=None,
            backend=default_backend()
        )

    def _sign_request(self, method: str, path: str, timestamp: str) -> str:
        message = f"{timestamp}{method}{path}"
        signature = self.private_key.sign(
            message.encode(),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode()

    def _get_headers(self, method: str, path: str) -> dict:
        timestamp = str(int(time.time() * 1000))
        signature = self._sign_request(method, path, timestamp)
        return {
            "KALSHI-ACCESS-KEY": self.api_key,
            "KALSHI-ACCESS-SIGNATURE": signature,
            "KALSHI-ACCESS-TIMESTAMP": timestamp,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def get_market(self, ticker: str) -> dict:
        path = f"/markets/{ticker}"
        headers = self._get_headers("GET", path)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{path}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()

    async def get_orderbook(self, ticker: str) -> dict:
        path = f"/markets/{ticker}/orderbook"
        headers = self._get_headers("GET", path)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{path}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()

    async def get_market_with_orderbook(self, ticker: str) -> tuple[dict, dict]:
        async with httpx.AsyncClient() as client:
            market_path = f"/markets/{ticker}"
            market_headers = self._get_headers("GET", market_path)
            market_response = await client.get(
                f"{self.base_url}{market_path}",
                headers=market_headers
            )
            market_response.raise_for_status()

            orderbook_path = f"/markets/{ticker}/orderbook"
            orderbook_headers = self._get_headers("GET", orderbook_path)
            orderbook_response = await client.get(
                f"{self.base_url}{orderbook_path}",
                headers=orderbook_headers
            )
            orderbook_response.raise_for_status()

            return market_response.json(), orderbook_response.json()

    async def get_markets(self, limit: int = 100, status: str = "open") -> dict:
        """
        Fetch markets from Kalshi API.

        Args:
            limit: Number of markets to return (max 100)
            status: Market status filter (open, closed, settled)

        Returns:
            dict with 'markets' list
        """
        path = f"/markets?limit={limit}&status={status}"
        headers = self._get_headers("GET", path)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{path}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()

    async def get_market_history(
        self,
        ticker: str,
        days: int = 30,
        period_interval: int = 1440  # 1440 minutes = 1 day
    ) -> dict:
        """
        Fetch historical candlestick data for a market.

        Args:
            ticker: Market ticker
            days: Number of days of history to fetch (default 30)
            period_interval: Interval in minutes (1440 = daily candles)

        Returns:
            dict with 'candles' list containing OHLC data
        """
        # Calculate start and end timestamps
        end_ts = int(datetime.now().timestamp())
        start_ts = int((datetime.now() - timedelta(days=days)).timestamp())

        # Kalshi series ticker is usually the base part of the market ticker
        # e.g., "KXBTC-25DEC31-100000" -> series might be "KXBTC"
        series_ticker = ticker.split("-")[0] if "-" in ticker else ticker

        path = f"/series/{series_ticker}/markets/{ticker}/candlesticks"
        query = f"?start_ts={start_ts}&end_ts={end_ts}&period_interval={period_interval}"
        full_path = path + query

        headers = self._get_headers("GET", full_path)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{full_path}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()


kalshi_client = KalshiClient()

