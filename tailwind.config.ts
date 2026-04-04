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
        background: "#050508",
        foreground: "#f0f0f0",
        "neon-red": "#FF2020",
        "neon-cyan": "#00F5FF",
        "neon-purple": "#b600ff",
        surface: "#0a0a10",
        "surface-light": "#12121a",
        border: "#1a1a2e",
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "sans-serif"],
        body: ["var(--font-exo2)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-red": "glowRed 2s ease-in-out infinite",
        "glow-cyan": "glowCyan 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
      },
      keyframes: {
        glowRed: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,32,32,0.3), 0 0 40px rgba(255,32,32,0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(255,32,32,0.5), 0 0 60px rgba(255,32,32,0.2)" },
        },
        glowCyan: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,245,255,0.3), 0 0 40px rgba(0,245,255,0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(0,245,255,0.5), 0 0 60px rgba(0,245,255,0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
