/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F4F7FF",
        secondary: "#0A84FF",
        surface: "#FFFFFF",
        navy: "#0D1B3D",
        muted: "#6B7A99",
        line: "#DCE4F3",
        accent: "#14B8A6",
        warning: "#F59E0B",
        success: "#16A34A",
        danger: "#DC2626",
        black: {
          DEFAULT: "#000",
          100: "#0D1B3D",
          200: "#1E293B",
        },
        gray: {
          100: "#CBD5E1",
          200: "#6B7A99",
          300: "#9AA6BF"
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
