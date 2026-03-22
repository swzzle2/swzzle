import NeonBackground from "@/components/NeonBackground";
import PnLDashboard from "@/components/PnLDashboard";
import TradesFeed from "@/components/TradesFeed";
import ReportsFeed from "@/components/ReportsFeed";
import PortfolioWidget from "@/components/PortfolioWidget";
import Link from "next/link";

export default function Home() {
  return (
    <div
      className="relative min-h-screen cosmic-grid w-full"
      style={{
        background: "radial-gradient(ellipse at top, #0d0020 0%, #000000 60%, #000814 100%)",
      }}
    >
      <NeonBackground />

      {/* Ambient glow orbs — clipped so they never cause horizontal scroll */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-200px", left: "-200px",
          width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(182,0,255,0.1) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "20%", right: "-150px",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(0,245,255,0.07) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-100px", left: "30%",
          width: "350px", height: "350px",
          background: "radial-gradient(circle, rgba(255,0,153,0.06) 0%, transparent 70%)",
        }} />
      </div>

      <div className="relative z-10 w-full">
        {/* HERO */}
        <section className="flex flex-col items-center px-4 text-center pt-16 pb-12 md:pt-28 md:pb-20">
          <div className="w-full max-w-5xl mx-auto space-y-4 md:space-y-6">

            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-6 md:w-12 bg-gradient-to-r from-transparent to-purple-500 flex-shrink-0" />
              <span className="text-xs font-mono uppercase tracking-[0.08em] md:tracking-[0.25em] text-purple-400">
                AI-Powered Crypto Intelligence
              </span>
              <div className="h-px w-6 md:w-12 bg-gradient-to-l from-transparent to-purple-500 flex-shrink-0" />
            </div>

            {/* Main title */}
            <div className="glitch w-full overflow-hidden">
              <h1
                className="hero-title font-black leading-none w-full text-center"
                style={{ fontSize: "clamp(52px, 17vw, 220px)", letterSpacing: "-0.02em" }}
              >
                SWZZLE
              </h1>
            </div>

            {/* Tagline */}
            <p
              className="font-mono font-bold uppercase text-white/90 px-2"
              style={{
                fontSize: "clamp(10px, 3vw, 20px)",
                letterSpacing: "0.06em",
                textShadow: "0 0 20px rgba(0,245,255,0.4)",
                lineHeight: 1.4,
              }}
            >
              The World&apos;s Most Savage Crypto Trading AI
            </p>

            {/* Sub-tagline */}
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed px-2">
              Real-time algorithmic execution. Zero emotion. Pure alpha.
            </p>

            {/* Ticker */}
            <div
              className="overflow-hidden w-full"
              style={{
                borderTop: "1px solid rgba(182,0,255,0.3)",
                borderBottom: "1px solid rgba(182,0,255,0.3)",
                padding: "8px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "48px",
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

        </section>

        <hr className="neon-hr" />

        {/* PORTFOLIO */}
        <PortfolioWidget />

        <hr className="neon-hr" />

        {/* P&L DASHBOARD */}
        <section className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16">
          <div className="mb-5 md:mb-8">
            <h2 className="text-xs font-mono uppercase tracking-[0.15em] md:tracking-[0.3em] text-gray-500 mb-1">
              Performance Metrics
            </h2>
            <h3 className="text-xl md:text-4xl font-black neon-text-purple">
              Live P&amp;L Dashboard
            </h3>
          </div>
          <PnLDashboard />
        </section>

        <hr className="neon-hr" />

        {/* TRADES FEED */}
        <section className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16">
          <div className="mb-5 md:mb-8">
            <h2 className="text-xs font-mono uppercase tracking-[0.15em] md:tracking-[0.3em] text-gray-500 mb-1">
              Real-Time Execution
            </h2>
            <h3 className="text-xl md:text-4xl font-black neon-text-cyan">
              Live Trade Feed
            </h3>
            <p className="text-gray-500 text-xs md:text-sm mt-1">Last 20 trades — updates in real-time</p>
          </div>
          <TradesFeed limit={20} />
        </section>

        <hr className="neon-hr" />

        {/* REPORTS */}
        <section className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16">
          <div className="mb-5 md:mb-8">
            <h2 className="text-xs font-mono uppercase tracking-[0.15em] md:tracking-[0.3em] text-gray-500 mb-1">
              Crypto Intelligence
            </h2>
            <h3 className="text-xl md:text-4xl font-black neon-text-pink">
              The Swzzle
            </h3>
            <p className="text-gray-500 text-xs md:text-sm mt-1">Hourly drops — what&apos;s moving, why it matters, what to watch</p>
          </div>
          <ReportsFeed />
        </section>

        <hr className="neon-hr" />

        {/* FOOTER */}
        <footer className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
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
          <p className="text-gray-600 text-xs font-mono text-center px-4">
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
