"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import HQDashboard from "@/components/HQDashboard";
import Link from "next/link";

const ALLOWED_EMAIL = "hello@swzzle.com";

export default function HQPage() {
  const [session, setSession] = useState<{ user: { email?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email === ALLOWED_EMAIL) {
        setSession(data.session);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess?.user?.email === ALLOWED_EMAIL) {
        setSession(sess);
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSigning(true);

    if (email.toLowerCase() !== ALLOWED_EMAIL) {
      setError("Access denied. This terminal is restricted.");
      setSigning(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
    }
    setSigning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at center, #0d0020 0%, #000000 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"
          />
          <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Initializing...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 cosmic-grid"
        style={{ background: "radial-gradient(ellipse at top, #0d0020 0%, #000000 100%)" }}
      >
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
            width: "600px", height: "400px",
            background: "radial-gradient(ellipse, rgba(182,0,255,0.1) 0%, transparent 70%)",
          }} />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Back link */}
          <div className="mb-8">
            <Link href="/" className="text-xs font-mono text-gray-600 hover:text-purple-400 transition-colors uppercase tracking-widest">
              ← Back to Swzzle
            </Link>
          </div>

          <div className="neon-card p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div
                className="text-4xl font-black"
                style={{
                  background: "linear-gradient(135deg, #b600ff, #00f5ff, #ff0099)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                SWZZLE HQ
              </div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-[0.2em]">
                Classified Terminal — Restricted Access
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-widest block">
                  Operator Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@swzzle.com"
                  className="neon-input"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-widest block">
                  Passphrase
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="neon-input"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div
                  className="text-xs font-mono text-red-400 p-3 rounded border border-red-500/30"
                  style={{ background: "rgba(255,0,85,0.08)" }}
                >
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={signing}
                className="btn-neon w-full mt-2"
              >
                {signing ? "Authenticating..." : "Enter HQ"}
              </button>
            </form>

            <p className="text-center text-xs font-mono text-gray-700">
              Unauthorized access attempts are logged.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <HQDashboard />;
}
