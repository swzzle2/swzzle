"""
Swzzle Bot — Robinhood Crypto Trading API v1 integration.
Uses Ed25519 signing via PyNaCl.

Install deps:
    pip install requests PyNaCl

Usage:
    from swzzle_bot import SwzzleBot
    bot = SwzzleBot()
    print(bot.get_account())
"""

import base64
import json
import time
import uuid
from typing import Optional

import nacl.signing
import requests

API_KEY     = "rh-api-0096f7f6-02ca-4c80-86f7-e3f9eb610f16"
PRIVATE_KEY = "Z6BvHtBJRsqga4SqXlo9FZCfhMLlbkrUUWBPHCY6YVo="
BASE_URL    = "https://trading.robinhood.com"

MAX_QUOTE_AMOUNT = 25.0


class SwzzleBot:
    def __init__(self, api_key: str = API_KEY, private_key_b64: str = PRIVATE_KEY, base_url: str = BASE_URL):
        self.api_key  = api_key
        self.base_url = base_url.rstrip("/")
        raw = base64.b64decode(private_key_b64)
        self._signing_key = nacl.signing.SigningKey(raw)

    # ── Auth ────────────────────────────────────────────────────────────────

    def _sign(self, method: str, path: str, body: str = "") -> dict:
        timestamp = str(int(time.time()))
        message   = f"{self.api_key}{timestamp}{path}{method.upper()}{body}"
        sig_bytes = self._signing_key.sign(message.encode()).signature
        signature = base64.b64encode(sig_bytes).decode()
        return {
            "x-api-key":   self.api_key,
            "x-timestamp": timestamp,
            "x-signature": signature,
            "Content-Type": "application/json; charset=utf-8",
        }

    def _request(self, method: str, path: str, params: Optional[dict] = None, body: Optional[dict] = None):
        body_str = json.dumps(body) if body else ""
        headers  = self._sign(method, path, body_str)
        url      = self.base_url + path
        resp = requests.request(
            method,
            url,
            headers=headers,
            params=params,
            data=body_str or None,
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    # ── Account ─────────────────────────────────────────────────────────────

    def get_account(self) -> dict:
        """Return the crypto trading account info."""
        return self._request("GET", "/api/v1/crypto/trading/accounts/")

    # ── Holdings ────────────────────────────────────────────────────────────

    def get_holdings(self, *asset_codes: str) -> dict:
        """
        Return holdings for given asset codes (e.g. "BTC", "ETH").
        If no codes given, returns all holdings.
        """
        params = {}
        if asset_codes:
            params["asset_code"] = ",".join(asset_codes)
        return self._request("GET", "/api/v1/crypto/trading/holdings/", params=params)

    # ── Market Data ─────────────────────────────────────────────────────────

    def get_best_bid_ask(self, *symbols: str) -> dict:
        """
        Return best bid/ask for given trading pair symbols (e.g. "BTC-USD").
        """
        params = {}
        if symbols:
            params["symbol"] = ",".join(symbols)
        return self._request("GET", "/api/v1/crypto/marketdata/best_bid_ask/", params=params)

    # ── Orders ──────────────────────────────────────────────────────────────

    def place_market_order(self, symbol: str, quote_amount: float, side: str = "buy") -> dict:
        """
        Place a market order using dollar (quote) amount.
        Max quote_amount is capped at $25.
        side: "buy" or "sell"
        """
        amount = min(float(quote_amount), MAX_QUOTE_AMOUNT)
        body = {
            "client_order_id": str(uuid.uuid4()),
            "side":            side.lower(),
            "symbol":          symbol.upper(),
            "type":            "market",
            "market_order_config": {
                "quote_amount": str(amount),
            },
        }
        return self._request("POST", "/api/v1/crypto/trading/orders/", body=body)

    def get_orders(self, **filters) -> dict:
        """Return list of orders. Pass keyword filters (symbol, state, etc.)."""
        return self._request("GET", "/api/v1/crypto/trading/orders/", params=filters or None)

    def get_order(self, order_id: str) -> dict:
        """Return details for a single order."""
        return self._request("GET", f"/api/v1/crypto/trading/orders/{order_id}/")

    def cancel_order(self, order_id: str) -> dict:
        """Cancel an open order."""
        return self._request("POST", f"/api/v1/crypto/trading/orders/{order_id}/cancel/")


# ── CLI smoke test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    bot = SwzzleBot()

    print("=== Account ===")
    try:
        print(json.dumps(bot.get_account(), indent=2))
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n=== Holdings (BTC, ETH) ===")
    try:
        print(json.dumps(bot.get_holdings("BTC", "ETH"), indent=2))
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n=== Best Bid/Ask (BTC-USD, ETH-USD) ===")
    try:
        print(json.dumps(bot.get_best_bid_ask("BTC-USD", "ETH-USD"), indent=2))
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n=== Recent Orders ===")
    try:
        print(json.dumps(bot.get_orders(), indent=2))
    except Exception as e:
        print(f"  ERROR: {e}")
