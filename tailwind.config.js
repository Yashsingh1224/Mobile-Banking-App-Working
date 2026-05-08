/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F5F8FB",
        secondary: "#10B981",
        surface: "#FFFFFF",
        navy: "#0F2742",
        muted: "#64748B",
        line: "#E2E8F0",
        accent: "#2563EB",
        warning: "#F59E0B",
        black: {
          DEFAULT: "#000",
          100: "#0F2742",
          200: "#1E293B",
        },
        gray: {
          100: "#CBD5E1",
          200: "#64748B",
          300: "#94A3B8"
        },
      },
      fontFamily: {
        pbold: ["SF-Bold", "sans-serif"],
        psemibold: ["SF-Semi-Bold", "sans-serif"],
        pmedium: ["SF-Medium", "sans-serif"],
        pregular: ["SF-Regular", "sans-serif"],
      },
    },
  },
  plugins: [],
};
