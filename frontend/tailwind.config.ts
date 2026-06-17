import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "neon-cyan": "#00f5ff",
        "neon-green": "#39ff14",
        "neon-pink": "#ff2d78",
        "neon-purple": "#bf5fff",
        surface: "#0a0a0f",
        "surface-2": "#111118",
        "surface-3": "#1a1a24",
        "border-dim": "#252535",
        "text-muted": "#6b7280",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        "neon-cyan": "0 0 16px #00f5ff40, 0 0 40px #00f5ff15",
        "neon-green": "0 0 16px #39ff1440, 0 0 40px #39ff1415",
        "neon-pink": "0 0 16px #ff2d7840, 0 0 40px #ff2d7815",
        "neon-purple": "0 0 16px #bf5fff40",
        card: "0 4px 24px rgba(0,0,0,0.6)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 2s linear infinite",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
