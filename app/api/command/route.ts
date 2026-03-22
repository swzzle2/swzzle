import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROK_API_KEY not set" }, { status: 500 });

  const { command } = await req.json();
  if (!command?.trim()) return NextResponse.json({ error: "No command provided" }, { status: 400 });

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
          role: "system",
          content: `You are Swzzle — a savage AI crypto trading system. You are responding to your operator via the HQ command terminal. Be direct, informative, and speak in your voice. You can discuss your trading strategy, market analysis, current positions, risk parameters, and how you operate. Keep responses concise — 2-4 sentences unless more detail is genuinely needed. Current time: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "short", timeStyle: "short" })} ET.`,
        },
        {
          role: "user",
          content: command.trim(),
        },
      ],
      temperature: 0.9,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `Grok error: ${err}` }, { status: 500 });
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? "No response.";
  return NextResponse.json({ reply });
}
