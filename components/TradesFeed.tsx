"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Trade {
  id: number;
  symbol?: string;
  side?: string;
  amount?: number;
  price?: number;
  pnl?: number;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export default function TradesFeed({ limit = 20 }: { limit?: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      const { data } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (data) setTrades(data as Trade[]);
      setLoading(false);
    };

    fetchTrades();

    const channel = supabase
      .channel("trades-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "trades" }, () => {
        fetchTrades();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="neon-card p-3 animate-pulse h-12" />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="neon-card p-8 text-center">
        <p className="text-gray-500 font-mono text-sm">No trades yet. The beast is warming up...</p>
      </div>
    );
  }

  return (
    <div className="neon-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-purple-900/40">
              <th className="text-left py-3 px-4 text-gray-500 uppercase tracking-wider text-xs">Symbol</th>
              <th className="text-left py-3 px-4 text-gray-500 uppercase tracking-wider text-xs">Side</th>
              <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider text-xs">Price</th>
              <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider text-xs">Amount</th>
              <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider text-xs">P&L</th>
              <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider text-xs hidden md:table-cell">Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const isBuy = trade.side?.toLowerCase() === "buy";
              const pnl = trade.pnl;
              return (
                <tr key={trade.id} className="trade-row">
                  <td className="py-3 px-4">
                    <span className="neon-text-cyan font-bold">{trade.symbol || "—"}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={isBuy ? "badge badge-buy" : "badge badge-sell"}>
                      {trade.side || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">
                    {trade.price != null
                      ? `$${Number(trade.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">
                    {trade.amount != null
                      ? Number(trade.amount).toLocaleString("en-US", { maximumFractionDigits: 4 })
                      : "—"}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${pnl == null ? "text-gray-500" : pnl >= 0 ? "profit" : "loss"}`}>
                    {pnl == null
                      ? "—"
                      : `${pnl >= 0 ? "+" : ""}$${Number(pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 hidden md:table-cell">
                    {trade.created_at
                      ? new Date(trade.created_at).toLocaleTimeString()
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
