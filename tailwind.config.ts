import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      opacity: {
        "2": "0.02",
        "3": "0.03",
        "7": "0.07",
        "8": "0.08",
        "12": "0.12",
        "15": "0.15",
      },
      fontFamily: {
        sans: ["Pretendard", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
        },
        teal: {
          400: "#2DD4BF",
          500: "#0D9488",
          600: "#0F766E",
          700: "#0F5F5C",
        },
        gold: {
          400: "#D97706",
          500: "#B45309",
          600: "#92400E",
        },
        navy: {
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
        },
      },
      backgroundImage: {
        "hero-pattern": "url('/hero-bg.png')",
        "teal-gradient": "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)",
        "gold-gradient": "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.6s ease-out",
        slideUp: "slideUp 0.6s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
