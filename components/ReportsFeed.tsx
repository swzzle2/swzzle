"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Report {
  id: number;
  title?: string;
  content?: string;
  created_at?: string;
  [key: string]: unknown;
}

function renderContent(raw: string) {
  // Split into sections by ## headings
  const lines = raw.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("# ")) {
      // Skip top-level title (already in card header)
    } else if (line.startsWith("### ")) {
      elements.push(
        <p key={key++} className="text-[11px] font-mono text-gray-600 mb-3">
          {line.replace("### ", "")}
        </p>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h4 key={key++} className="text-sm font-black uppercase tracking-wide mt-5 mb-2"
          style={{ color: "#b600ff" }}>
          {line.replace("## ", "")}
        </h4>
      );
    } else if (line.startsWith("---")) {
      // Skip dividers
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      elements.push(
        <p key={key++} className="text-gray-300 text-sm leading-relaxed">
          {line}
        </p>
      );
    }
  }
  return elements;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ReportsFeed({ limit = 3 }: { limit?: number }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, title, content, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (data) setReports(data as Report[]);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("reports-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="neon-card animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="neon-card p-8 text-center">
        <p className="text-gray-500 font-mono text-sm">Next drop coming soon...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report, i) => {
        const isOpen = expanded === report.id;
        const isLatest = i === 0;

        return (
          <div
            key={report.id}
            className="report-card cursor-pointer"
            style={isLatest ? { borderColor: "rgba(182,0,255,0.4)" } : {}}
            onClick={() => setExpanded(isOpen ? null : report.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {isLatest && (
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ background: "rgba(182,0,255,0.2)", color: "#b600ff", border: "1px solid rgba(182,0,255,0.3)" }}>
                      LATEST
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-gray-500">
                    {report.created_at ? timeAgo(report.created_at) : ""}
                  </span>
                  {report.created_at && (
                    <span className="text-[11px] font-mono text-gray-700">
                      · {new Date(report.created_at).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                        month: "short", day: "numeric",
                        hour: "numeric", minute: "2-digit", hour12: true,
                      })} ET
                    </span>
                  )}
                </div>
                <h3 className="neon-text-pink font-black text-sm md:text-base leading-tight">
                  {report.title || "The Swzzle"}
                </h3>
              </div>
              <span className="text-gray-600 flex-shrink-0 mt-1 text-lg">
                {isOpen ? "▲" : "▼"}
              </span>
            </div>

            {isOpen && report.content && (
              <div className="mt-4 pt-4 border-t border-purple-900/30">
                <div className="space-y-0.5">
                  {renderContent(report.content)}
                </div>
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}
