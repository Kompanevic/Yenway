import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0b",
        panel: "#161617",
        line: "#2a2a2c",
        accent: "#e7e5e1",
        accent2: "#c9c7c2"
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "'Helvetica Neue'", "Arial", "sans-serif"],
        display: ["'Unbounded Variable'", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
