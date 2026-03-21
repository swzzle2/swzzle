import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROK_API_KEY not set" }, { status: 500 });

  const { activity, from, to } = await req.json();
  if (!activity) return NextResponse.json({ error: "No activity provided" }, { status: 400 });

  const prompt = `You are Swzzle — savage AI trading system. Summarize what happened across this activity log.

Date range: ${from} to ${to}

Activity log:
${activity}

Write a tight, punchy summary in the Swzzle voice covering:
- What the bots were doing (Grok analysis, Claude commands, trade execution)
- Key wins and losses
- Any patterns or notable moments
- Overall vibe of the period

Keep it under 200 words. Savage and honest. No fluff.`;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content ?? "No summary generated.";
  return NextResponse.json({ summary });
}
