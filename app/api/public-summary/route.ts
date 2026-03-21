import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = "https://odcdhadqufanxqozgwdb.supabase.co";

function getSupabase() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(SUPABASE_URL, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() + 1);
    weekStart.setUTCHours(0, 0, 0, 0);

    const [latestRes, firstRes, dailyStartRes, weeklyStartRes, tradesRes] =
      await Promise.all([
        // Current portfolio value
        supabase
          .from("portfolio")
          .select("total_value, holdings_json, updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single(),

        // All-time starting value (first ever snapshot)
        supabase
          .from("portfolio")
          .select("total_value, updated_at")
          .order("updated_at", { ascending: true })
          .limit(1)
          .single(),

        // First snapshot of today
        supabase
          .from("portfolio")
          .select("total_value")
          .gte("updated_at", todayStart.toISOString())
          .order("updated_at", { ascending: true })
          .limit(1)
          .single(),

        // First snapshot of this week
        supabase
          .from("portfolio")
          .select("total_value")
          .gte("updated_at", weekStart.toISOString())
          .order("updated_at", { ascending: true })
          .limit(1)
          .single(),

        // All closed trades (have a pnl value)
        supabase
          .from("trades")
          .select("pnl")
          .not("pnl", "is", null),
      ]);

    const current = Number(latestRes.data?.total_value) || 0;
    const starting = Number(firstRes.data?.total_value) || current;
    const dailyBase = Number(dailyStartRes.data?.total_value) || current;
    const weeklyBase = Number(weeklyStartRes.data?.total_value) || current;

    const trades = (tradesRes.data ?? []).map((t) => Number(t.pnl));
    const winners = trades.filter((p) => p > 0);
    const winRate = trades.length > 0 ? (winners.length / trades.length) * 100 : 0;
    const bestTrade = trades.length > 0 ? Math.max(...trades) : 0;
    const worstTrade = trades.length > 0 ? Math.min(...trades) : 0;

    const holdings = JSON.parse(latestRes.data?.holdings_json || "[]");
    const activePositions = holdings.filter(
      (h: { quantity?: number }) => (h.quantity ?? 0) > 0
    ).length;

    return NextResponse.json(
      {
        total_pnl: current - starting,
        daily_pnl: current - dailyBase,
        weekly_pnl: current - weeklyBase,
        win_rate: winRate,
        total_trades: trades.length,
        active_positions: activePositions,
        best_trade: bestTrade,
        worst_trade: worstTrade,
        current_value: current,
        starting_value: starting,
        started_at: firstRes.data?.updated_at,
        updated_at: latestRes.data?.updated_at,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
