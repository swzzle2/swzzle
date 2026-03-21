"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import TradesFeed from "@/components/TradesFeed";
import PnLDashboard from "@/components/PnLDashboard";
import ReportsFeed from "@/components/ReportsFeed";
import Link from "next/link";

type Tab = "overview" | "trades" | "reports" | "command";

export default function HQDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [killed, setKilled] = useState(false);
  const [command, setCommand] = useState("");
  const [cmdLog, setCmdLog] = useState<Array<{ ts: string; msg: string; type: "in" | "out" | "err" }>>([]);
  const [sending, setSending] = useState(false);
  const [killing, setKilling] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [cmdLog]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleKillSwitch = async () => {
    setKilling(true);
    try {
      const { error } = await supabase
        .from("bot_status")
        .upsert({ id: 1, killed: !killed, updated_at: new Date().toISOString() });
      if (!error) setKilled(!killed);
    } catch {
      // fallback: just toggle UI
      setKilled(!killed);
    }
    setKilling(false);
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    setSending(true);
    const ts = new Date().toLocaleTimeString();
    const msg = command.trim();
    setCmdLog((prev) => [...prev, { ts, msg, type: "in" }]);
    setCommand("");

    try {
      const { error } = await supabase
        .from("commands")
        .insert({ content: msg, created_at: new Date().toISOString() });
      if (error) {
        setCmdLog((prev) => [...prev, { ts: new Date().toLocaleTimeString(), msg: `Error: ${error.message}`, type: "err" }]);
      } else {
        setCmdLog((prev) => [...prev, { ts: new Date().toLocaleTimeString(), msg: "Command received. Swzzle is processing...", type: "out" }]);
      }
    } catch (err) {
      setCmdLog((prev) => [...prev, { ts: new Date().toLocaleTimeString(), msg: `Failed to send: ${err}`, type: "err" }]);
    }
    setSending(false);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "trades", label: "All Trades" },
    { id: "reports", label: "Reports" },
    { id: "command", label: "Command" },
  ];

  return (
    <div
      className="min-h-screen cosmic-grid"
      style={{ background: "radial-gradient(ellipse at top, #0d0020 0%, #000000 70%)" }}
    >
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-purple-900/30 backdrop-blur-md"
        style={{ background: "rgba(0,0,0,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-mono text-gray-600 hover:text-purple-400 transition-colors">
              ←
            </Link>
            <span
              className="font-black text-lg"
              style={{
                background: "linear-gradient(90deg, #b600ff, #00f5ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SWZZLE HQ
            </span>
            <span className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-500">
              <span className="status-dot online" />
              Operational
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Kill switch */}
            <button
              onClick={handleKillSwitch}
              disabled={killing}
              className={`btn-kill text-xs py-2 px-4 ${killed ? "active" : ""}`}
            >
              {killing ? "..." : killed ? "▶ RESUME" : "■ KILL"}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-mono text-gray-600 hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all border-b-2 ${
                tab === t.id
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-600 hover:text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Kill switch banner */}
      {killed && (
        <div className="bg-red-950/60 border-b border-red-500/40 px-4 py-3">
          <p className="text-center text-xs font-mono text-red-400 uppercase tracking-widest">
            ⚠ KILL SWITCH ACTIVE — Trading halted. Click RESUME to restart.
          </p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {tab === "overview" && (
          <>
            <section>
              <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-4">
                Performance Overview
              </h2>
              <PnLDashboard />
            </section>

            <hr className="neon-hr" />

            <section>
              <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-4">
                Recent Trades
              </h2>
              <TradesFeed limit={10} />
            </section>
          </>
        )}

        {tab === "trades" && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-4">
              All Trades
            </h2>
            <TradesFeed limit={100} />
          </section>
        )}

        {tab === "reports" && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-4">
              Intelligence Reports
            </h2>
            <ReportsFeed />
          </section>
        )}

        {tab === "command" && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-4">
              Command Terminal
            </h2>
            <div className="neon-card overflow-hidden">
              {/* Log output */}
              <div
                ref={logRef}
                className="h-80 overflow-y-auto p-4 font-mono text-xs space-y-2"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                <div className="text-purple-400">
                  SWZZLE COMMAND TERMINAL v1.0 — Authorized operators only.
                </div>
                <div className="text-gray-600">
                  Send instructions to the trading bot below.
                </div>
                {cmdLog.length === 0 && (
                  <div className="text-gray-700 mt-4">No commands sent yet.</div>
                )}
                {cmdLog.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-gray-700 flex-shrink-0">{entry.ts}</span>
                    {entry.type === "in" && (
                      <span>
                        <span className="text-cyan-400">operator&gt; </span>
                        <span className="text-white">{entry.msg}</span>
                      </span>
                    )}
                    {entry.type === "out" && (
                      <span className="text-green-400">swzzle&gt; {entry.msg}</span>
                    )}
                    {entry.type === "err" && (
                      <span className="text-red-400">error&gt; {entry.msg}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendCommand} className="flex gap-3 p-4 border-t border-purple-900/30">
                <span className="text-cyan-400 font-mono text-sm self-center flex-shrink-0">
                  operator&gt;
                </span>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Enter instruction for Swzzle..."
                  className="neon-input text-sm"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !command.trim()}
                  className="btn-neon text-xs py-2 px-5 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? "..." : "Send"}
                </button>
              </form>
            </div>

            <div className="mt-4 text-xs font-mono text-gray-700">
              Commands are stored in the database and processed by the Swzzle trading engine.
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
