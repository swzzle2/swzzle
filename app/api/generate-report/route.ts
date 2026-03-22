import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { webcrypto } from "node:crypto";

const SUPABASE_URL = "https://odcdhadqufanxqozgwdb.supabase.co";
const RH_BASE      = "https://trading.robinhood.com";

// Keys come from env vars — add RH_API_KEY and RH_PRIVATE_KEY to Vercel
const RH_API_KEY        = process.env.RH_API_KEY        ?? "";
const RH_PRIVATE_KEY_B64 = process.env.RH_PRIVATE_KEY   ?? "";

const PRICE_SYMBOLS = ["BTC-USD", "ETH-USD", "SOL-USD", "PEPE-USD", "DOGE-USD"];

function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_KEY not set");
  return createClient(SUPABASE_URL, key);
}

function getGrokKey() {
  const key = process.env.GROK_API_KEY;
  if (!key) throw new Error("GROK_API_KEY not set");
  return key;
}

// ── Robinhood price fetching ──────────────────────────────────────────────────

async function rhSign(signedPath: string): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message   = `${RH_API_KEY}${timestamp}${signedPath}GET`;

  const rawKey = Buffer.from(RH_PRIVATE_KEY_B64, "base64");
  const key    = await webcrypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "Ed25519" },
    false,
    ["sign"]
  );
  const sigBuf    = await webcrypto.subtle.sign("Ed25519", key, new TextEncoder().encode(message));
  const signature = Buffer.from(sigBuf).toString("base64");

  return {
    "x-api-key":    RH_API_KEY,
    "x-timestamp":  timestamp,
    "x-signature":  signature,
    "Content-Type": "application/json; charset=utf-8",
  };
}

async function fetchRHPrices(symbols: string[]): Promise<Record<string, number>> {
  const basePath   = "/api/v1/crypto/marketdata/best_bid_ask/";
  const qs         = symbols.map((s) => `symbol=${s}`).join("&");
  const signedPath = `${basePath}?${qs}`;

  const headers = await rhSign(signedPath);
  const url     = `${RH_BASE}${basePath}?${qs}`;
  const resp    = await fetch(url, { headers });

  if (!resp.ok) {
    throw new Error(`RH price fetch ${resp.status}: ${await resp.text()}`);
  }

  const data: Record<string, unknown> = await resp.json();
  const result: Record<string, number> = {};

  for (const item of ((data.results as Record<string, string>[]) ?? [])) {
    const sym = item.symbol ?? "";
    const bid = parseFloat(item.bid_inclusive_of_sell_spread ?? item.price ?? "0");
    const ask = parseFloat(item.ask_inclusive_of_buy_spread  ?? item.price ?? String(bid));
    if (sym && (bid || ask)) {
      result[sym] = bid && ask ? (bid + ask) / 2 : bid || ask;
    }
  }
  return result;
}

function formatPrice(sym: string, prices: Record<string, number>): string {
  const p = prices[sym];
  if (p == null) return "unavailable";
  if (p < 0.001)  return `$${p.toFixed(8)}`;
  if (p < 1)      return `$${p.toFixed(6)}`;
  if (p < 100)    return `$${p.toFixed(4)}`;
  return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(prices: Record<string, number>): string {
  const now    = new Date();
  const etTime = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday:  "long",
    month:    "long",
    day:      "numeric",
    hour:     "numeric",
    minute:   "2-digit",
    hour12:   true,
  });

  const hasPrices = Object.keys(prices).length > 0;

  const priceBlock = hasPrices
    ? `CURRENT REAL PRICES AS OF RIGHT NOW — USE ONLY THESE, DO NOT USE ANY OTHER PRICES:
BTC:  ${formatPrice("BTC-USD",  prices)}
ETH:  ${formatPrice("ETH-USD",  prices)}
SOL:  ${formatPrice("SOL-USD",  prices)}
PEPE: ${formatPrice("PEPE-USD", prices)}
DOGE: ${formatPrice("DOGE-USD", prices)}

These prices come directly from the Robinhood API at the moment this prompt was generated. Any price you have from training data is outdated. Use ONLY the numbers above when referencing these assets.`
    : `(Live price feed unavailable — do not invent specific prices. Refer to price ranges or percentage moves instead.)`;

  return `${priceBlock}

---

You are writing THE SWZZLE — a crypto intelligence brief that traders actually want to read. This is published hourly and read by serious crypto traders and degens alike. The tone is sharp, confident, a little savage, and always informative. Think: Bloomberg Terminal meets Crypto Twitter. No fluff. No hedging. No disclaimers.

The current time is ${etTime} ET.

Write THE SWZZLE brief for this hour. Use your most current knowledge of crypto markets, narratives, and what's circulating on X (Twitter) and in the broader crypto space. Cover what's ACTUALLY happening right now — prices, catalysts, sentiment, drama, opportunity. ALWAYS use the real prices provided above when mentioning BTC, ETH, SOL, PEPE, or DOGE.

Structure it EXACTLY like this, using these section headers:

---
# THE SWZZLE
### [Day], [Month] [Date] · [Time] ET

## 🔥 WHAT'S MOVING
The top 3–5 crypto stories RIGHT NOW. For each one: what's happening, why it matters, what the price action looks like, and what traders are saying. Be specific — name the coins, name the price levels, name the catalysts. This is the section people screenshot and share.

## 📊 MARKET PULSE
One tight paragraph on the overall market structure right now. Is BTC leading or lagging? Is risk appetite on or off? What's the fear/greed reading? Are altcoins seeing rotation? What's BTC dominance doing? Give traders the 10-second market read.

## 👀 UNDER THE RADAR
2–3 smaller caps, narratives, or setups that aren't in the headlines but should be. This is where sharp traders find edge. Explain why it's interesting and what to watch.

## ⚡ HOT TAKES
3–5 punchy, opinionated takes on the current market. These should be the kind of thing you'd tweet and it would get 500 retweets. Provocative, informed, spicy. Not reckless — but not boring either.

## 📅 WHAT TO WATCH NEXT HOUR
Specific catalysts, levels, or events in the next 60 minutes that could move markets. Data releases, unlocks, liquidation levels, key price levels being tested. Tell traders exactly what to have their eyes on.
---

Write it now. Make it so good that a trader who reads it feels like they just got the alpha drop. Be specific, be bold, be right.`;
}

// ── Grok call ─────────────────────────────────────────────────────────────────

async function callGrok(prompt: string): Promise<string> {
  const apiKey = getGrokKey();

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       "grok-4",
      messages:    [{ role: "user", content: prompt }],
      temperature: 1.0,
      max_tokens:  3000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok API error ${response.status}: ${err}`);
  }

  const data    = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Grok returned empty content");
  return content;
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function saveReport(content: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const now    = new Date();
  const etTime = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour:     "numeric",
    minute:   "2-digit",
    hour12:   true,
  });
  const etDate = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month:    "short",
    day:      "numeric",
  });
  const title = `The Swzzle — ${etDate} ${etTime} ET`;

  const { error } = await supabase.from("reports").insert({
    title,
    content,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }

async function handler(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch real prices from Robinhood
    let prices: Record<string, number> = {};
    if (RH_API_KEY && RH_PRIVATE_KEY_B64) {
      console.log("[generate-report] Fetching live prices from Robinhood...");
      try {
        prices = await fetchRHPrices(PRICE_SYMBOLS);
        console.log("[generate-report] Prices:", JSON.stringify(prices));
      } catch (e) {
        console.warn("[generate-report] Price fetch failed, continuing without:", e);
      }
    } else {
      console.warn("[generate-report] RH_API_KEY / RH_PRIVATE_KEY not set — skipping price fetch");
    }

    // 2. Build prompt with real prices injected
    console.log("[generate-report] Building prompt...");
    const prompt = buildPrompt(prices);

    // 3. Call Grok
    console.log("[generate-report] Calling Grok...");
    const reportContent = await callGrok(prompt);

    // 4. Save
    console.log("[generate-report] Saving report...");
    await saveReport(reportContent);

    console.log("[generate-report] Done.");
    return NextResponse.json({ success: true, pricesFetched: Object.keys(prices).length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-report] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
