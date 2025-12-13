from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Configuration settings loaded from environment variables."""

    kalshi_api_key: str = Field(..., description="Kalshi API Key ID")
    kalshi_rsa_private_key: str = Field(..., description="Base64-encoded RSA private key")
    kalshi_base_url: str = Field(
        default="https://api.elections.kalshi.com/trade-api/v2",
        description="Kalshi API base URL"
    )
    openai_api_key: str = Field(..., description="OpenAI API key")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

    def get_private_key_pem(self) -> str:
        """Decode base64 private key to PEM format."""
        import base64
        return base64.b64decode(self.kalshi_rsa_private_key).decode("utf-8")


settings = Settings()

