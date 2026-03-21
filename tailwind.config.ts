import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        neon: {
          purple: "#b600ff",
          cyan: "#00f5ff",
          pink: "#ff0099",
          green: "#00ff88",
          orange: "#ff6600",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "scan-line": "scanLine 4s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "ticker": "ticker 30s linear infinite",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { textShadow: "0 0 20px #b600ff, 0 0 40px #b600ff, 0 0 80px #b600ff" },
          "50%": { textShadow: "0 0 40px #00f5ff, 0 0 80px #00f5ff, 0 0 120px #00f5ff" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      backgroundImage: {
        "cosmic": "radial-gradient(ellipse at top, #0a0015 0%, #000000 50%, #000814 100%)",
        "neon-grid": "linear-gradient(rgba(182,0,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(182,0,255,0.05) 1px, transparent 1px)",
        "card-glow": "linear-gradient(135deg, rgba(182,0,255,0.1) 0%, rgba(0,245,255,0.05) 50%, rgba(255,0,153,0.1) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
