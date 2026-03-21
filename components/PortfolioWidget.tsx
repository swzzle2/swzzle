"use client";

import { useEffect, useState } from "react";

interface Holding {
  symbol: string;
  assetCode: string;
  quantity: number;
  value: number;
  price: number;
}

interface PortfolioData {
  total: number;
  cash: number;
  holdings: Holding[];
  updatedAt: string;
  error?: string;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtQty(n: number): string {
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(4);
  if (n < 1)      return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export default function PortfolioWidget() {
  const [data, setData]       = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/portfolio");
      const json = await res.json();
      setData(json);
    } catch {
      setData({ total: 0, cash: 0, holdings: [], updatedAt: "", error: "Failed to load portfolio" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-4">
        <div className="neon-card animate-pulse h-28" />
        <div className="neon-card animate-pulse h-32" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="neon-card p-6 text-center">
          <p className="text-gray-500 font-mono text-sm">
            {data?.error ?? "Portfolio unavailable"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-4">
      {/* Section label */}
      <div className="mb-2">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] md:tracking-[0.3em] text-gray-500 mb-1">
          Live Account
        </h2>
        <h3 className="text-xl md:text-4xl font-black neon-text-purple">
          Portfolio
        </h3>
      </div>

      {/* Total value card */}
      <div
        className="neon-card p-5 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        style={{ borderColor: "rgba(182,0,255,0.4)" }}
      >
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">
            Total Portfolio Value
          </p>
          <p
            className="font-black leading-none"
            style={{
              fontSize: "clamp(32px, 6vw, 64px)",
              background: "linear-gradient(135deg, #b600ff, #00f5ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${fmt(data.total)}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Live</span>
          </div>
          {data.updatedAt && (
            <span className="text-[10px] font-mono text-gray-700">
              Updated {new Date(data.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Holdings breakdown */}
      <div className="neon-card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-purple-900/30">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">Holdings</p>
        </div>

        {/* Cash row */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-purple-900/20 hover:bg-purple-900/5 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88" }}
            >
              $
            </div>
            <div>
              <p className="font-mono font-bold text-white text-sm">USD</p>
              <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Cash</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-sm" style={{ color: "#00ff88" }}>
              ${fmt(data.cash)}
            </p>
            {data.total > 0 && (
              <p className="text-[10px] font-mono text-gray-600">
                {((data.cash / data.total) * 100).toFixed(1)}% of portfolio
              </p>
            )}
          </div>
        </div>

        {/* Crypto holdings */}
        {data.holdings.length === 0 ? (
          <div className="px-6 py-6 text-center">
            <p className="text-gray-600 font-mono text-xs">No crypto positions</p>
          </div>
        ) : (
          data.holdings
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((h) => (
              <div
                key={h.assetCode}
                className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-purple-900/20 last:border-0 hover:bg-purple-900/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                    style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}
                  >
                    {h.assetCode.slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-mono font-bold text-white text-sm">{h.assetCode}</p>
                    <p className="text-[10px] font-mono text-gray-600">
                      {fmtQty(h.quantity)} {h.assetCode}
                      {h.price > 0 && (
                        <span className="ml-2 text-gray-700">@ ${fmt(h.price)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm neon-text-cyan">
                    ${fmt(h.value)}
                  </p>
                  {data.total > 0 && (
                    <p className="text-[10px] font-mono text-gray-600">
                      {((h.value / data.total) * 100).toFixed(1)}% of portfolio
                    </p>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </section>
  );
}
