import NeonBackground from "@/components/NeonBackground";
import PnLDashboard from "@/components/PnLDashboard";
import TradesFeed from "@/components/TradesFeed";
import ReportsFeed from "@/components/ReportsFeed";
import Link from "next/link";

export default function Home() {
  return (
    <div
      className="relative min-h-screen cosmic-grid"
      style={{
        background: "radial-gradient(ellipse at top, #0d0020 0%, #000000 60%, #000814 100%)",
      }}
    >
      <NeonBackground />


      {/* Ambient glow orbs */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-200px",
          left: "-200px",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(182,0,255,0.12) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          top: "20%",
          right: "-150px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: "-100px",
          left: "30%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255,0,153,0.07) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <div className="relative z-10">
        {/* HERO */}
        <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center pb-20">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-purple-500 flex-shrink-0" />
              <span className="text-xs font-mono uppercase tracking-[0.1em] md:tracking-[0.3em] text-purple-400 text-center">
                AI-Powered Crypto Intelligence
              </span>
              <div className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-purple-500 flex-shrink-0" />
            </div>

            {/* Main title */}
            <div className="glitch">
              <h1
                className="hero-title font-black leading-none tracking-tight"
                style={{ fontSize: "clamp(80px, 18vw, 220px)" }}
              >
                SWZZLE
              </h1>
            </div>

            {/* Tagline */}
            <p
              className="font-mono font-bold uppercase tracking-[0.15em] text-white/90"
              style={{
                fontSize: "clamp(14px, 2.5vw, 22px)",
                textShadow: "0 0 30px rgba(0,245,255,0.5)",
              }}
            >
              The World&apos;s Most Savage Crypto Trading AI
            </p>

            {/* Sub-tagline */}
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Real-time algorithmic execution. Zero emotion. Pure alpha.
              Watch the machine print money while you sleep.
            </p>

            {/* Stats ticker */}
            <div
              className="mt-8 overflow-hidden"
              style={{
                borderTop: "1px solid rgba(182,0,255,0.3)",
                borderBottom: "1px solid rgba(182,0,255,0.3)",
                padding: "10px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "60px",
                  animation: "ticker 20s linear infinite",
                  width: "max-content",
                }}
              >
                {[
                  "BTC/USDT", "ETH/USDT", "SOL/USDT", "AVAX/USDT",
                  "BNB/USDT", "ARB/USDT", "OP/USDT", "LINK/USDT",
                  "BTC/USDT", "ETH/USDT", "SOL/USDT", "AVAX/USDT",
                  "BNB/USDT", "ARB/USDT", "OP/USDT", "LINK/USDT",
                ].map((sym, i) => (
                  <span key={i} className="text-xs font-mono text-purple-400 tracking-widest whitespace-nowrap">
                    ⬥ {sym}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-purple-500 to-transparent" />
          </div>
        </section>

        <hr className="neon-hr" />

        {/* P&L DASHBOARD */}
        <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="mb-8">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-2">
              Performance Metrics
            </h2>
            <h3 className="text-2xl md:text-4xl font-black neon-text-purple">
              Live P&amp;L Dashboard
            </h3>
          </div>
          <PnLDashboard />
        </section>

        <hr className="neon-hr" />

        {/* TRADES FEED */}
        <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="mb-8">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-2">
              Real-Time Execution
            </h2>
            <h3 className="text-2xl md:text-4xl font-black neon-text-cyan">
              Live Trade Feed
            </h3>
            <p className="text-gray-500 text-sm mt-2">Last 20 trades — updates in real-time</p>
          </div>
          <TradesFeed limit={20} />
        </section>

        <hr className="neon-hr" />

        {/* REPORTS */}
        <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="mb-8">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-2">
              Market Intelligence
            </h2>
            <h3 className="text-2xl md:text-4xl font-black neon-text-pink">
              Swzzle Reports
            </h3>
            <p className="text-gray-500 text-sm mt-2">Hourly AI analysis and market insights</p>
          </div>
          <ReportsFeed />
        </section>

        <hr className="neon-hr" />

        {/* FOOTER */}
        <footer className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="font-black text-xl"
              style={{
                background: "linear-gradient(90deg, #b600ff, #00f5ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SWZZLE
            </span>
            <span className="text-gray-600 text-xs font-mono">© 2025</span>
          </div>
          <p className="text-gray-600 text-xs font-mono text-center">
            Not financial advice. Past performance does not guarantee future results.
          </p>
          <Link
            href="/hq"
            className="text-xs font-mono uppercase tracking-widest text-gray-700 hover:text-purple-400 transition-colors"
          >
            Powered by Swzzle →
          </Link>
        </footer>
      </div>
    </div>
  );
}
