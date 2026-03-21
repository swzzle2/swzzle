import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";

const API_KEY     = "rh-api-0096f7f6-02ca-4c80-86f7-e3f9eb610f16";
const PRIVATE_KEY = "Z6BvHtBJRsqga4SqXlo9FZCfhMLlbkrUUWBPHCY6YVo=";
const BASE_URL    = "https://trading.robinhood.com";

// Build signing key pair once from the 32-byte seed
const _seed    = decodeBase64(PRIVATE_KEY);           // 32 bytes
const _keyPair = nacl.sign.keyPair.fromSeed(_seed);   // { publicKey, secretKey }

function buildHeaders(method: string, path: string, body = ""): Record<string, string> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  // Sign: API_KEY + timestamp + path (no query string) + METHOD + body
  const message   = `${API_KEY}${timestamp}${path}${method.toUpperCase()}${body}`;
  const msgBytes  = new TextEncoder().encode(message);
  const sigBytes  = nacl.sign.detached(msgBytes, _keyPair.secretKey);
  return {
    "x-api-key":    API_KEY,
    "x-timestamp":  timestamp,
    "x-signature":  encodeBase64(sigBytes),
    "Content-Type": "application/json; charset=utf-8",
  };
}

async function rhGet(path: string, params?: Record<string, string>) {
  const url = new URL(BASE_URL + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  // Sign the path without query string (Robinhood signs the path only)
  const resp = await fetch(url.toString(), {
    headers: buildHeaders("GET", path),
    next: { revalidate: 30 },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Robinhood ${path} → ${resp.status}: ${txt}`);
  }
  return resp.json();
}

export interface Holding {
  symbol: string;
  assetCode: string;
  quantity: number;
  value: number;
  price: number;
}

export interface PortfolioData {
  total: number;
  cash: number;
  holdings: Holding[];
  updatedAt: string;
}

export async function GET() {
  try {
    // 1. Account — cash / buying power
    const accountData = await rhGet("/api/v1/crypto/trading/accounts/");
    const cash = parseFloat(accountData?.buying_power ?? accountData?.portfolio_cash ?? "0") || 0;

    // 2. Holdings list
    const holdingsData = await rhGet("/api/v1/crypto/trading/holdings/");
    const rawHoldings: Array<Record<string, unknown>> = holdingsData?.results ?? [];

    // Filter to positions that have a non-zero quantity
    const activeHoldings = rawHoldings.filter(
      (h) => parseFloat(String(h.total_quantity ?? "0")) > 0
    );

    let holdings: Holding[] = [];

    if (activeHoldings.length > 0) {
      // 3. Best bid/ask for all held assets to price them
      const symbols = activeHoldings.map((h) => `${h.asset_code}-USD`).join(",");
      const priceData = await rhGet("/api/v1/crypto/marketdata/best_bid_ask/", { symbol: symbols });
      const priceMap: Record<string, number> = {};
      for (const item of priceData?.results ?? []) {
        const sym = String(item.symbol ?? "");
        // Use mark_price if available, else midpoint of bid/ask
        const bid  = parseFloat(String(item.bid_inclusive_of_sell_spread ?? item.bid ?? "0"));
        const ask  = parseFloat(String(item.ask_inclusive_of_buy_spread ?? item.ask ?? "0"));
        const mark = parseFloat(String(item.mark_price ?? "0"));
        priceMap[sym] = mark > 0 ? mark : (bid + ask) / 2;
      }

      holdings = activeHoldings.map((h) => {
        const assetCode = String(h.asset_code ?? "");
        const symbol    = `${assetCode}-USD`;
        const quantity  = parseFloat(String(h.total_quantity ?? "0"));
        const price     = priceMap[symbol] ?? 0;
        return {
          symbol,
          assetCode,
          quantity,
          price,
          value: quantity * price,
        };
      });
    }

    const cryptoTotal = holdings.reduce((sum, h) => sum + h.value, 0);
    const total       = cash + cryptoTotal;

    const portfolio: PortfolioData = {
      total,
      cash,
      holdings,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(portfolio);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[portfolio]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
