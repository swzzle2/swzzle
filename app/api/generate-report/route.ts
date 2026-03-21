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

function buildPrompt(): string {
  const now = new Date();
  const etTime = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `You are writing THE SWZZLE — a crypto intelligence brief that traders actually want to read. This is published hourly and read by serious crypto traders and degens alike. The tone is sharp, confident, a little savage, and always informative. Think: Bloomberg Terminal meets Crypto Twitter. No fluff. No hedging. No disclaimers.

The current time is ${etTime} ET.

Write THE SWZZLE brief for this hour. Use your most current knowledge of crypto markets, narratives, and what's circulating on X (Twitter) and in the broader crypto space. Cover what's ACTUALLY happening right now — prices, catalysts, sentiment, drama, opportunity.

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
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
      max_tokens: 3000,
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
  const etTime = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const etDate = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
  });
  const title = `The Swzzle — ${etDate} ${etTime} ET`;

  const { error } = await supabase.from("reports").insert({
    title,
    content,
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
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[generate-report] Building prompt...");
    const prompt = buildPrompt();

    console.log("[generate-report] Calling Grok...");
    const reportContent = await callGrok(prompt);

    console.log("[generate-report] Saving report...");
    await saveReport(reportContent);

    console.log("[generate-report] Done.");
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-report] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
