/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sp: {
          green: "#1DB954",
          black: "#121212",
          dark: "#181818",
          card: "#282828",
          hover: "#333333",
          muted: "#A7A7A7",
        },
      },
    },
  },
  plugins: [],
};
