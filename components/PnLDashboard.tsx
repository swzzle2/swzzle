"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PublicSummary {
  id?: number;
  total_pnl?: number;
  daily_pnl?: number;
  weekly_pnl?: number;
  win_rate?: number;
  total_trades?: number;
  active_positions?: number;
  best_trade?: number;
  worst_trade?: number;
  updated_at?: string;
  [key: string]: unknown;
}

function StatCard({
  label,
  value,
  color = "cyan",
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: string | number | undefined;
  color?: "cyan" | "purple" | "pink" | "green" | "red";
  prefix?: string;
  suffix?: string;
}) {
  const colorMap = {
    cyan: "neon-text-cyan",
    purple: "neon-text-purple",
    pink: "neon-text-pink",
    green: "neon-text-green",
    red: "text-red-400",
  };

  const formatted =
    value === undefined || value === null
      ? "—"
      : typeof value === "number"
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : value;

  return (
    <div className="neon-card p-5 flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest text-gray-500 font-mono">{label}</span>
      <span className={`text-2xl md:text-3xl font-black font-mono ${colorMap[color]}`}>
        {prefix}{formatted}{suffix}
      </span>
    </div>
  );
}

export default function PnLDashboard() {
  const [data, setData] = useState<PublicSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: rows } = await supabase
      .from("public_summary")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rows) setData(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const pnlColor = (val?: number) =>
    val === undefined ? "cyan" : val >= 0 ? "green" : "red";

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="neon-card p-5 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="status-dot online" />
        <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
          Live P&amp;L — updates every 15s
        </span>
        {data?.updated_at && (
          <span className="text-xs font-mono text-gray-600 ml-auto">
            Last: {new Date(data.updated_at).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total P&L"
          value={data?.total_pnl}
          color={pnlColor(data?.total_pnl)}
          prefix="$"
        />
        <StatCard
          label="Daily P&L"
          value={data?.daily_pnl}
          color={pnlColor(data?.daily_pnl)}
          prefix="$"
        />
        <StatCard
          label="Weekly P&L"
          value={data?.weekly_pnl}
          color={pnlColor(data?.weekly_pnl)}
          prefix="$"
        />
        <StatCard
          label="Win Rate"
          value={data?.win_rate}
          color="purple"
          suffix="%"
        />
        <StatCard
          label="Total Trades"
          value={data?.total_trades}
          color="cyan"
        />
        <StatCard
          label="Open Positions"
          value={data?.active_positions}
          color="pink"
        />
        <StatCard
          label="Best Trade"
          value={data?.best_trade}
          color="green"
          prefix="$"
        />
        <StatCard
          label="Worst Trade"
          value={data?.worst_trade}
          color="red"
          prefix="$"
        />
      </div>
    </div>
  );
}
