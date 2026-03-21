import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  rank: number;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);

    const data = await res.json();

    const coins: CoinPrice[] = data.map(
      (c: {
        id: string;
        symbol: string;
        name: string;
        current_price: number;
        price_change_percentage_24h: number;
        market_cap: number;
        market_cap_rank: number;
      }) => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        price: c.current_price,
        change24h: c.price_change_percentage_24h ?? 0,
        marketCap: c.market_cap,
        rank: c.market_cap_rank,
      })
    );

    return NextResponse.json(coins, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
