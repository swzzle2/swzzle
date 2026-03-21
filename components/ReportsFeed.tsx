"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Report {
  id: number;
  title?: string;
  content?: string;
  summary?: string;
  period?: string;
  created_at?: string;
  [key: string]: unknown;
}

export default function ReportsFeed() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setReports(data as Report[]);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("reports-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="report-card animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="neon-card p-8 text-center">
        <p className="text-gray-500 font-mono text-sm">No reports yet. Swzzle is compiling intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="report-card cursor-pointer"
          onClick={() => setExpanded(expanded === report.id ? null : report.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                {report.period && (
                  <span className="badge badge-buy text-xs">{report.period}</span>
                )}
                <span className="text-xs font-mono text-gray-500">
                  {report.created_at
                    ? new Date(report.created_at).toLocaleString()
                    : ""}
                </span>
              </div>
              <h3 className="neon-text-cyan font-bold text-sm md:text-base truncate">
                {report.title || "Swzzle Intelligence Report"}
              </h3>
              {report.summary && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                  {report.summary}
                </p>
              )}
            </div>
            <span className="text-gray-600 flex-shrink-0 mt-1">
              {expanded === report.id ? "▲" : "▼"}
            </span>
          </div>

          {expanded === report.id && report.content && (
            <div className="mt-4 pt-4 border-t border-purple-900/30">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {report.content}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
