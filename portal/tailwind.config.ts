import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        void: "#050505",
        ink: "#f4f5f7",
        mute: "#8b909a",
        crimson: "#9a1f1f",
        hot: "#c43a2a",
        steel: "#c5c8ce",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "Impact", "sans-serif"],
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ['"Share Tech Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
