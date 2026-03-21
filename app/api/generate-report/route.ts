import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://odcdhadqufanxqozgwdb.supabase.co";

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

async function fetchContext() {
  const supabase = getSupabaseAdmin();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [summaryRes, tradesRes] = await Promise.all([
    supabase
      .from("public_summary")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("trades")
      .select("symbol, side, price, amount, pnl, created_at")
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    summary: summaryRes.data,
    trades: tradesRes.data ?? [],
  };
}

function buildPrompt(
  summary: Record<string, unknown> | null,
  trades: Array<Record<string, unknown>>
): string {
  const tradeSummary =
    trades.length === 0
      ? "No trades executed this hour."
      : trades
          .map(
            (t) =>
              `${t.side?.toString().toUpperCase() ?? "?"} ${t.symbol ?? "?"} @ $${t.price ?? "?"} | size: ${t.amount ?? "?"} | pnl: ${t.pnl != null ? `$${t.pnl}` : "open"}`
          )
          .join("\n");

  const pnlBlock = summary
    ? `Total P&L: $${summary.total_pnl ?? "??"} | Daily: $${summary.daily_pnl ?? "??"} | Win Rate: ${summary.win_rate ?? "??"}% | Total Trades: ${summary.total_trades ?? "??"}`
    : "P&L data unavailable.";

  return `You are Swzzle — an AI crypto trading system writing your hourly intelligence report. This report is read by people who want to understand HOW and WHY you make decisions, not just what happened. Be analytical, honest, and educational. Explain your thinking clearly so readers can learn from it.

TRADING DATA FROM THIS HOUR:
${pnlBlock}

TRADES THIS HOUR:
${tradeSummary}

YOUR MISSION:
Search X (Twitter) and the web RIGHT NOW for real-time crypto market context, news, and sentiment from the last hour. Use what you find as part of your analysis below.

Write the full Swzzle Report using these exact sections:

---
## SCOREBOARD
Result for this hour: total P&L, number of trades taken, win/loss breakdown, biggest single winner and loser. Be honest — no spin.

## WHAT I LOOKED AT THIS HOUR
List the specific signals, indicators, and information sources I scanned this hour. What price levels were I watching? What on-chain data, funding rates, order book depth, or volume patterns caught my attention? What was the broader market doing (BTC dominance, fear/greed index, altcoin sector rotation)? Include specific findings from X and web searches — name assets, price levels, and narratives that were circulating.

## WHY I ACTED (OR DIDN'T)
For each trade taken: explain exactly what triggered the entry, what the thesis was, what the risk/reward setup looked like, and what the exit logic was. If I passed on setups that looked interesting — explain what I saw and why I decided to wait or skip. This is the most important section. Be specific enough that a reader could understand the decision-making framework.

## WHAT WORKED AND WHAT DIDN'T
Honest post-mortem on this hour's decisions. Which calls were right for the right reasons? Which were right by accident? Which were wrong — and what was the mistake (bad entry timing, wrong thesis, ignored signal, overconfidence)? No excuses. Just clear analysis.

## MARKET CONTEXT (FROM X + WEB)
Based on live searches: What is the crypto world talking about right now? Specific assets, specific narratives, specific events. What is pumping and why? What is getting destroyed and why? What news broke in the last hour that matters? What is noise vs. signal? Cite specific things found.

## WHAT I'M WATCHING NEXT HOUR
Specific setups being monitored going into the next hour. Asset, current price, the level that triggers action, and the reason. What would make me bullish vs. bearish on each. Risk factors that could invalidate the thesis.
---

Write the full report now. Be specific, analytical, and educational. Readers should finish this report understanding not just what happened, but how to think about these markets.`;
}

async function callGrok(prompt: string): Promise<string> {
  const apiKey = getGrokKey();

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      search_parameters: {
        mode: "on",
        return_citations: true,
        sources: [
          { type: "x" },
          { type: "web" },
        ],
      },
      temperature: 1.0,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Grok returned empty content");
  return content;
}

async function saveReport(content: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const now = new Date();
  const hourStr = now.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
  const title = `Swzzle Report — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} ${hourStr} UTC`;

  // Extract first paragraph as summary
  const summaryMatch = content.match(/(?:SCOREBOARD\s*\n+)([\s\S]{20,200}?)(?:\n\n|\n##)/);
  const summary = summaryMatch?.[1]?.trim().slice(0, 200) ?? content.slice(0, 200).trim();

  const { error } = await supabase.from("reports").insert({
    title,
    content,
    summary,
    period: "hourly",
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
}

// Allow both GET (for Vercel cron) and POST (for manual triggers)
export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}

async function handler(req: NextRequest) {
  // Verify Vercel cron secret if present
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[generate-report] Fetching trading context...");
    const { summary, trades } = await fetchContext();

    console.log(`[generate-report] Got ${trades.length} trades this hour. Calling Grok...`);
    const prompt = buildPrompt(summary, trades);
    const reportContent = await callGrok(prompt);

    console.log("[generate-report] Saving report to Supabase...");
    await saveReport(reportContent);

    console.log("[generate-report] Done.");
    return NextResponse.json({ success: true, tradeCount: trades.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-report] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
