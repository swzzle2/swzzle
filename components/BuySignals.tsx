"use client";

import { useState, useEffect } from "react";

type Signal = {
  id: number;
  symbol: string;
  price: number;
  reason: string;
  scanned_at: string;
};

const VISIBLE_COUNT = 9;

export default function BuySignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/signals");
        const data = await res.json();
        setSignals(data.signals ?? []);
      } catch {
        setSignals([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">
            Current Buys
          </span>
        </div>
        <div className="text-gray-700 text-xs font-mono">Scanning markets...</div>
      </section>
    );
  }

  if (signals.length === 0) {
    return (
      <section className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">
            Current Buys
          </span>
        </div>
        <div className="text-gray-700 text-xs font-mono">No active buy signals right now.</div>
      </section>
    );
  }

  const visible = expanded ? signals : signals.slice(0, VISIBLE_COUNT);
  const overflow = signals.length - VISIBLE_COUNT;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">
          Current Buys
        </span>
        <span className="text-xs font-mono text-green-400">{signals.length} active</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((sig) => (
          <div
            key={sig.id}
            className="neon-card p-3 flex flex-col gap-1.5"
            style={{ borderColor: "rgba(0,255,128,0.2)" }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-black text-sm tracking-wide"
                style={{
                  background: "linear-gradient(90deg, #00ff80, #00f5ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {sig.symbol.replace("-USD", "")}
              </span>
              <span className="text-xs font-mono text-white/70">
                ${Number(sig.price).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: sig.price < 1 ? 6 : 2,
                })}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {sig.reason.replace(/^(BUY|SELL|HOLD)[,.]?\s*/i, "")}
            </p>
          </div>
        ))}
      </div>

      {overflow > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors"
        >
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
          {expanded ? "Show less" : `+${overflow} more signals`}
        </button>
      )}
    </section>
  );
}
