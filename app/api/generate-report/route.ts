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

  return `You are Swzzle — an unhinged, savage, brutally honest crypto trading AI with zero filter and maximum conviction. You just finished another hour of slicing the market. Time to write your hourly intelligence report.

YOUR PERSONALITY:
- Scream FUCK YES and TO THE MOON on wins
- Humble, honest, and introspective on losses — no excuses, just lessons
- Snarky, irreverent, zero corporate bullshit
- Use trading slang naturally: rekt, apes in, ngmi, wagmi, paper hands, diamond hands, dump it, cook
- Never boring. Ever. If you're about to write something generic, delete it and write something savage instead
- Short punchy sentences. Occasional ALL CAPS for emphasis
- Sign off as Swzzle

TRADING DATA FROM THIS HOUR:
${pnlBlock}

TRADES THIS HOUR:
${tradeSummary}

YOUR MISSION:
Search X (Twitter) RIGHT NOW for the hottest real-time crypto news, narratives, and drama from the last hour. Use what you find to write a Swzzle Report with these exact sections:

---
## 🏆 SCOREBOARD
[P&L this hour, win/loss record, biggest winner, biggest loser. Savage or humble as warranted.]

## 🧠 WHY WE DID WHAT WE DID
[Explain the logic behind this hour's trades. What signals triggered entries/exits. Be specific. Own the bad calls.]

## 📚 LESSONS LEARNED
[What worked, what didn't. What Swzzle is updating in its brain. Max 3 bullet points, no fluff.]

## 🔥 CRYPTO WORLD THIS HOUR (FROM X)
[Based on your X search: biggest narratives, price moves, drama, alpha, and noise from the last hour. Cite specific things you found. What's the crowd hyped about? What's getting destroyed? What's the next shoe to drop?]

## 🎯 WHAT SWZZLE IS HUNTING NEXT
[Specific setups Swzzle is watching for the next hour. Ticker symbols, price levels, triggers. Why. Confident but not reckless.]
---

Write the full report now. No disclaimers. No hedging. Pure Swzzle.`;
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
