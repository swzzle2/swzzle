"use client";

import { useEffect, useState } from "react";

interface Summary {
  total_pnl: number;
  daily_pnl: number;
  weekly_pnl: number;
  win_rate: number;
  total_trades: number;
  active_positions: number;
  best_trade: number;
  worst_trade: number;
  current_value: number;
  starting_value: number;
  started_at?: string;
  updated_at?: string;
}

function fmt(val?: number) {
  if (val == null) return "—";
  return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({
  label,
  value,
  color = "cyan",
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number | undefined;
  color?: "cyan" | "purple" | "pink" | "green" | "red";
  prefix?: string;
  suffix?: string;
}) {
  const colorClass = {
    cyan:   "neon-text-cyan",
    purple: "neon-text-purple",
    pink:   "neon-text-pink",
    green:  "neon-text-green",
    red:    "text-red-400",
  }[color];

  return (
    <div className="neon-card p-3 flex flex-col gap-1 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-gray-500 font-mono leading-tight truncate">
        {label}
      </span>
      <span
        className={`font-black font-mono leading-tight ${colorClass}`}
        style={{ fontSize: "clamp(14px, 4vw, 26px)" }}
      >
        {prefix}{fmt(value)}{suffix}
      </span>
    </div>
  );
}

export default function PnLDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/public-summary", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const pnlColor = (val?: number): "green" | "red" | "cyan" =>
    val == null ? "cyan" : val >= 0 ? "green" : "red";

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="neon-card animate-pulse h-16 md:h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="status-dot online" />
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
          Live — 15s refresh
        </span>
        {data?.started_at && (
          <span className="text-xs font-mono text-gray-600">
            baseline {new Date(data.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        {data?.updated_at && (
          <span className="text-xs font-mono text-gray-600 ml-auto">
            {new Date(data.updated_at).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total P&L"      value={data?.total_pnl}        color={pnlColor(data?.total_pnl)}   prefix="$" />
        <StatCard label="Daily P&L"      value={data?.daily_pnl}        color={pnlColor(data?.daily_pnl)}   prefix="$" />
        <StatCard label="Weekly P&L"     value={data?.weekly_pnl}       color={pnlColor(data?.weekly_pnl)}  prefix="$" />
        <StatCard label="Win Rate"       value={data?.win_rate}         color="purple"                      suffix="%" />
        <StatCard label="Total Trades"   value={data?.total_trades}     color="cyan" />
        <StatCard label="Open Positions" value={data?.active_positions} color="pink" />
        <StatCard label="Best Trade"     value={data?.best_trade}       color="green"                       prefix="$" />
        <StatCard label="Worst Trade"    value={data?.worst_trade}      color="red"                         prefix="$" />
      </div>
    </div>
  );
}
