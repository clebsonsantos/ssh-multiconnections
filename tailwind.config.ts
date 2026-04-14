import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0d1117",
          secondary: "#161b22",
          tertiary: "#21262d",
          hover: "#30363d",
        },
        border: {
          default: "#30363d",
          muted: "#21262d",
        },
        text: {
          primary: "#e6edf3",
          secondary: "#8b949e",
          muted: "#6e7681",
        },
        accent: {
          blue: "#58a6ff",
          green: "#3fb950",
          red: "#f85149",
          yellow: "#d29922",
          purple: "#bc8cff",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Cascadia Code", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
