import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          neon: "#00E676",
        },
        surface: {
          base:      "#0A0A0E",
          sidebar:   "#0D0D11",
          card:      "#111115",
          secondary: "#161619",
          hover:     "#1A1A1F",
        },
        ink: {
          primary:   "#F8FAFC",
          secondary: "#94A3B8",
          muted:     "#64748B",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
