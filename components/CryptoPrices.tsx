"use client";

import { useEffect, useState } from "react";

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  rank: number;
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (p >= 1) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 0.01) return p.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return p.toLocaleString("en-US", { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}

function CoinRow({ coin }: { coin: CoinPrice }) {
  const up = coin.change24h >= 0;
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-mono text-gray-600 w-4 flex-shrink-0">{coin.rank}</span>
        <div className="min-w-0">
          <div className="text-xs font-black font-mono text-white truncate">{coin.symbol}</div>
          <div className="text-[10px] font-mono text-gray-500 truncate hidden sm:block">{coin.name}</div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-mono text-white">${fmtPrice(coin.price)}</div>
        <div className={`text-[10px] font-black font-mono ${up ? "text-green-400" : "text-red-400"}`}>
          {up ? "+" : ""}{coin.change24h.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

export default function CryptoPrices() {
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/crypto-prices", { cache: "no-store" });
      if (res.ok) {
        setCoins(await res.json());
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sort all coins by absolute % change — biggest movers first
  const sorted = [...coins].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
  const topMovers = sorted.slice(0, 9);
  // Rest sorted by market cap rank
  const rest = [...coins]
    .sort((a, b) => a.rank - b.rank)
    .filter((c) => !topMovers.find((m) => m.id === c.id));

  if (loading) {
    return (
      <section className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg h-12"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      </section>
    );
  }

  if (coins.length === 0) return null;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">
            Top Movers
          </span>
          <span className="text-[10px] font-mono text-gray-700">24h</span>
        </div>
        {lastUpdated && (
          <span className="text-[10px] font-mono text-gray-700">
            {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} ET
          </span>
        )}
      </div>

      {/* Top 9 movers */}
      <div className="grid grid-cols-3 gap-2">
        {topMovers.map((coin) => (
          <CoinRow key={coin.id} coin={coin} />
        ))}
      </div>

      {/* Expand/collapse */}
      {rest.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono text-gray-500 hover:text-purple-400 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
          >
            {expanded ? "▲ Hide" : `▼ Show all ${coins.length} coins`}
          </button>

          {expanded && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {rest.map((coin) => (
                <CoinRow key={coin.id} coin={coin} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
