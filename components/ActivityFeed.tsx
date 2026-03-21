"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Source = "trade" | "report" | "command" | "log";

interface ActivityItem {
  id: string;
  source: Source;
  actor: string;
  title: string;
  detail?: string;
  ts: string; // ISO
}

const SOURCE_META: Record<Source, { label: string; color: string; icon: string }> = {
  trade:   { label: "Bot",    color: "#00ff88", icon: "⚡" },
  report:  { label: "Grok",   color: "#00f5ff", icon: "🧠" },
  command: { label: "Claude", color: "#b600ff", icon: "🤖" },
  log:     { label: "System", color: "#ff9900", icon: "📡" },
};

function toItems(rows: Record<string, unknown>[], source: Source): ActivityItem[] {
  return rows.map((r) => {
    if (source === "trade") {
      const side = String(r.side ?? "").toUpperCase();
      const sym  = String(r.symbol ?? "?");
      const pnl  = r.pnl != null ? `  P&L: $${Number(r.pnl).toFixed(2)}` : "";
      return {
        id: `trade-${r.id}`,
        source,
        actor: "Bot",
        title: `${side} ${sym}${r.price ? ` @ $${Number(r.price).toFixed(4)}` : ""}`,
        detail: `Amount: ${r.amount ?? "?"}${pnl}`,
        ts: String(r.created_at ?? ""),
      };
    }
    if (source === "report") {
      return {
        id: `report-${r.id}`,
        source,
        actor: "Grok",
        title: String(r.title ?? "Swzzle Intelligence Report"),
        detail: r.summary ? String(r.summary).slice(0, 120) : undefined,
        ts: String(r.created_at ?? ""),
      };
    }
    if (source === "command") {
      return {
        id: `cmd-${r.id}`,
        source,
        actor: "Claude / Operator",
        title: String(r.content ?? r.message ?? "Command issued"),
        ts: String(r.created_at ?? ""),
      };
    }
    // log / generic
    return {
      id: `log-${r.id}`,
      source,
      actor: String(r.actor ?? r.source ?? "System"),
      title: String(r.message ?? r.content ?? r.event ?? JSON.stringify(r)),
      ts: String(r.created_at ?? ""),
    };
  });
}

function merge(lists: ActivityItem[][]): ActivityItem[] {
  return lists.flat().sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function sevenDaysAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export default function ActivityFeed() {
  const [items, setItems]       = useState<ActivityItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [dateFrom, setDateFrom] = useState(sevenDaysAgoISO());
  const [dateTo, setDateTo]     = useState(todayISO());
  const [summary, setSummary]   = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchAll = async (from: string, to: string) => {
    const fromISO = new Date(from).toISOString();
    const toISO   = new Date(to + "T23:59:59").toISOString();

    const [tradesRes, reportsRes, commandsRes] = await Promise.all([
      supabase.from("trades").select("*").gte("created_at", fromISO).lte("created_at", toISO).order("created_at", { ascending: false }).limit(200),
      supabase.from("reports").select("id,title,summary,created_at").gte("created_at", fromISO).lte("created_at", toISO).order("created_at", { ascending: false }).limit(100),
      supabase.from("commands").select("*").gte("created_at", fromISO).lte("created_at", toISO).order("created_at", { ascending: false }).limit(200),
    ]);

    // Try a second logs attempt without .maybeSingle (which coerces to null on missing table)
    const logItems: ActivityItem[] = [];
    try {
      const { data: logRows } = await supabase.from("logs").select("*").gte("created_at", fromISO).lte("created_at", toISO).order("created_at", { ascending: false }).limit(200);
      if (logRows) logItems.push(...toItems(logRows as Record<string, unknown>[], "log"));
    } catch { /* table may not exist */ }

    const all = merge([
      toItems((tradesRes.data ?? []) as Record<string, unknown>[], "trade"),
      toItems((reportsRes.data ?? []) as Record<string, unknown>[], "report"),
      toItems((commandsRes.data ?? []) as Record<string, unknown>[], "command"),
      logItems,
    ]);

    setItems(all);
    setLoading(false);
    setSummary(null);
  };

  // initial load + when date changes
  useEffect(() => {
    setLoading(true);
    fetchAll(dateFrom, dateTo);
  }, [dateFrom, dateTo]);

  // real-time subscriptions
  useEffect(() => {
    const handleChange = () => fetchAll(dateFrom, dateTo);

    const channels = [
      supabase.channel("activity-trades").on("postgres_changes", { event: "*", schema: "public", table: "trades" }, handleChange).subscribe(),
      supabase.channel("activity-reports").on("postgres_changes", { event: "*", schema: "public", table: "reports" }, handleChange).subscribe(),
      supabase.channel("activity-commands").on("postgres_changes", { event: "*", schema: "public", table: "commands" }, handleChange).subscribe(),
    ];

    return () => { channels.forEach((c) => supabase.removeChannel(c)); };
  }, [dateFrom, dateTo]);

  // auto-scroll to bottom (newest on default, but list is newest-first so top is "latest")
  useEffect(() => {
    if (!loading && items.length > 0) {
      // items are newest-first, so latest is at top — no need to scroll
    }
  }, [items, loading]);

  const handleSummarize = async () => {
    if (items.length === 0) return;
    setSummarizing(true);
    setSummary(null);
    try {
      const text = items.slice(0, 80).map((i) =>
        `[${new Date(i.ts).toLocaleString()}] ${i.actor} — ${i.title}${i.detail ? ` | ${i.detail}` : ""}`
      ).join("\n");

      const res = await fetch("/api/summarize-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity: text, from: dateFrom, to: dateTo }),
      });
      const json = await res.json();
      setSummary(json.summary ?? "No summary returned.");
    } catch (e) {
      setSummary(`Error: ${e}`);
    }
    setSummarizing(false);
  };

  const inputClass = "bg-black/60 border border-purple-900/50 rounded text-white text-xs font-mono px-2 py-1.5 outline-none focus:border-cyan-400 transition-colors";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
        </div>
        <button
          onClick={() => { setDateFrom(sevenDaysAgoISO()); setDateTo(todayISO()); }}
          className="text-xs font-mono text-gray-600 hover:text-purple-400 transition-colors"
        >
          Reset
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-mono text-gray-600">{items.length} events</span>
          <button
            onClick={handleSummarize}
            disabled={summarizing || items.length === 0}
            className="btn-neon text-xs py-1.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {summarizing ? "Analyzing..." : "✦ Summarize"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {(Object.entries(SOURCE_META) as [Source, typeof SOURCE_META[Source]][]).map(([src, meta]) => (
          <div key={src} className="flex items-center gap-1.5">
            <span style={{ color: meta.color }} className="text-xs">{meta.icon}</span>
            <span className="text-xs font-mono text-gray-500">{meta.label}</span>
          </div>
        ))}
      </div>

      {/* AI Summary panel */}
      {summary && (
        <div className="neon-card p-4 border-cyan-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Grok Summary</span>
            <button onClick={() => setSummary(null)} className="ml-auto text-gray-600 hover:text-gray-400 text-xs">✕</button>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">{summary}</p>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="neon-card h-14 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="neon-card p-10 text-center">
          <p className="text-gray-500 font-mono text-sm">No activity in this date range.</p>
        </div>
      ) : (
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-purple-900/40 pointer-events-none" />

          <div className="space-y-0">
            {items.map((item, idx) => {
              const meta = SOURCE_META[item.source];
              const isFirst = idx === 0;
              return (
                <div key={item.id} className="flex gap-4 group">
                  {/* dot */}
                  <div className="flex flex-col items-center flex-shrink-0 w-11">
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] mt-3 flex-shrink-0 transition-all group-hover:scale-110 z-10"
                      style={{
                        borderColor: meta.color,
                        background: `${meta.color}22`,
                        boxShadow: isFirst ? `0 0 10px ${meta.color}66` : undefined,
                      }}
                    >
                      {meta.icon}
                    </div>
                  </div>

                  {/* content */}
                  <div className={`flex-1 min-w-0 py-3 border-b border-purple-900/20 group-hover:bg-purple-900/5 transition-colors px-2 rounded-r`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}44` }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs md:text-sm text-white font-mono truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-600 flex-shrink-0 whitespace-nowrap">
                        {item.ts ? new Date(item.ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    {item.detail && (
                      <p className="text-xs text-gray-500 font-mono mt-1 ml-0 truncate">{item.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
