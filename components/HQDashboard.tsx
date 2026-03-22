"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import TradesFeed from "@/components/TradesFeed";
import PnLDashboard from "@/components/PnLDashboard";
import Link from "next/link";

type Tab = "overview" | "trades" | "command";
type LogType = "in" | "out" | "err" | "pending";

interface LogEntry {
  ts: string;
  msg: string;
  type: LogType;
}

function getTs() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function HQDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [killed, setKilled] = useState(false);
  const [command, setCommand] = useState("");
  const [cmdLog, setCmdLog] = useState<LogEntry[]>([]);
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
      setKilled(!killed);
    }
    setKilling(false);
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || sending) return;
    setSending(true);

    const msg = command.trim();
    setCmdLog((prev) => [...prev, { ts: getTs(), msg, type: "in" }]);
    setCommand("");

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: msg }),
      });
      const data = await res.json();

      if (!res.ok || !data.id) {
        setCmdLog((prev) => [
          ...prev,
          { ts: getTs(), msg: data.error ?? "Failed to queue command", type: "err" },
        ]);
        setSending(false);
        return;
      }

      const cmdId = data.id;

      setCmdLog((prev) => [
        ...prev,
        { ts: getTs(), msg: "⟳ Queued — waiting for bot to execute...", type: "pending" },
      ]);

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const r = await fetch(`/api/command?id=${cmdId}`);
          const d = await r.json();

          if (d.status === "executed") {
            clearInterval(poll);
            setCmdLog((prev) => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].type === "pending") {
                  updated[i] = { ts: getTs(), msg: d.result ?? "Done.", type: "out" };
                  break;
                }
              }
              return updated;
            });
            setSending(false);
          } else if (attempts >= 120) {
            clearInterval(poll);
            setCmdLog((prev) => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].type === "pending") {
                  updated[i] = {
                    ts: getTs(),
                    msg: "Bot not responding. Is swzzle_bot.py running? Command is still queued — it will execute when the bot starts.",
                    type: "err",
                  };
                  break;
                }
              }
              return updated;
            });
            setSending(false);
          }
        } catch {
          // network blip — keep polling
        }
      }, 5000);
    } catch (err) {
      setCmdLog((prev) => [
        ...prev,
        { ts: getTs(), msg: `Failed to send: ${err}`, type: "err" },
      ]);
      setSending(false);
    }
  };

  const tabs: { id: Tab; label: string; short: string }[] = [
    { id: "overview", label: "Overview",   short: "Home"   },
    { id: "trades",   label: "All Trades", short: "Trades" },
    { id: "command",  label: "Command",    short: "CMD"    },
  ];

  return (
    <div
      className="min-h-screen cosmic-grid"
      style={{ background: "radial-gradient(ellipse at top, #0d0020 0%, #000000 70%)" }}
    >
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-purple-900/30 backdrop-blur-md"
        style={{ background: "rgba(0,0,0,0.9)" }}>
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="text-sm font-mono text-gray-600 hover:text-purple-400 transition-colors flex-shrink-0">
              ←
            </Link>
            <span
              className="font-black text-base md:text-lg flex-shrink-0"
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

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleKillSwitch}
              disabled={killing}
              className={`btn-kill text-xs py-1.5 px-3 md:py-2 md:px-4 ${killed ? "active" : ""}`}
            >
              {killing ? "..." : killed ? "▶ RESUME" : "■ KILL"}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-mono text-gray-600 hover:text-red-400 transition-colors uppercase tracking-wider hidden sm:block"
            >
              Logout
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-mono text-gray-600 hover:text-red-400 transition-colors sm:hidden px-1"
              title="Logout"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-7xl mx-auto px-1 md:px-4 flex border-t border-purple-900/20">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 md:flex-none px-2 md:px-4 py-2.5 text-xs font-mono uppercase tracking-wide transition-all border-b-2 ${
                tab === t.id
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-600 hover:text-gray-400"
              }`}
            >
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Kill switch banner */}
      {killed && (
        <div className="bg-red-950/60 border-b border-red-500/40 px-4 py-2">
          <p className="text-center text-xs font-mono text-red-400 uppercase tracking-widest">
            ⚠ KILL SWITCH ACTIVE — Trading halted
          </p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {tab === "overview" && (
          <>
            <section>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500 mb-4">
                Performance Overview
              </h2>
              <PnLDashboard />
            </section>

            <hr className="neon-hr" />

            <section>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500 mb-4">
                Recent Trades
              </h2>
              <TradesFeed limit={10} />
            </section>
          </>
        )}

        {tab === "trades" && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500 mb-4">
              All Trades
            </h2>
            <TradesFeed limit={500} />
          </section>
        )}

        {tab === "command" && (
          <section>
            <div className="mb-4">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500 mb-1">
                Command Terminal
              </h2>
              <p className="text-gray-600 text-xs font-mono">
                Commands are queued in the database and executed by the bot within 60 seconds.
              </p>
            </div>

            <div className="neon-card overflow-hidden">
              <div
                ref={logRef}
                className="h-64 md:h-96 overflow-y-auto p-3 md:p-4 font-mono text-xs space-y-2"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                <div className="text-purple-400">SWZZLE COMMAND TERMINAL v2.0</div>
                <div className="text-gray-600">Commands: buy [sym] [amt] | sell [sym] | pause | resume | status | or ask anything</div>
                {cmdLog.length === 0 && (
                  <div className="text-gray-700 mt-4">No commands sent yet.</div>
                )}
                {cmdLog.map((entry, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-700 flex-shrink-0 hidden sm:inline">{entry.ts}</span>
                    {entry.type === "in" && (
                      <span className="min-w-0">
                        <span className="text-cyan-400">op&gt; </span>
                        <span className="text-white break-all">{entry.msg}</span>
                      </span>
                    )}
                    {entry.type === "out" && (
                      <span className="text-green-400 break-all">swzzle&gt; {entry.msg}</span>
                    )}
                    {entry.type === "pending" && (
                      <span className="text-yellow-500 break-all animate-pulse">bot&gt; {entry.msg}</span>
                    )}
                    {entry.type === "err" && (
                      <span className="text-red-400 break-all">error&gt; {entry.msg}</span>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendCommand} className="flex gap-2 p-3 md:p-4 border-t border-purple-900/30">
                <span className="text-cyan-400 font-mono text-xs md:text-sm self-center flex-shrink-0 hidden sm:inline">
                  op&gt;
                </span>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="buy SOL 25 | sell BTC | pause | resume | status"
                  className="neon-input text-sm flex-1 min-w-0"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !command.trim()}
                  className="btn-neon text-xs py-2 px-3 md:px-5 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? "⟳" : "Send"}
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
