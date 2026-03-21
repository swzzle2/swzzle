import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = "https://odcdhadqufanxqozgwdb.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from("portfolio")
      .select("total_value, cash, holdings_json, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw new Error(error.message);
    if (!data)  throw new Error("No portfolio data found");

    const holdings: Holding[] = JSON.parse(data.holdings_json || "[]");

    const portfolio: PortfolioData = {
      total:      Number(data.total_value) || 0,
      cash:       Number(data.cash) || 0,
      holdings,
      updatedAt:  data.updated_at,
    };

    return NextResponse.json(portfolio, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[portfolio]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
