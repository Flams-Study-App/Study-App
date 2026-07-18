/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0C16",
        panel: "#12142299",
        violet: {
          DEFAULT: "#7C5CFF",
          soft: "#9B85FF",
        },
        cyan: {
          DEFAULT: "#22D3EE",
        },
        amber: {
          DEFAULT: "#FBBF24",
        },
        ink: {
          100: "#F3F2FA",
          300: "#B7B6C9",
          500: "#7C7B93",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        glow: "0 0 24px rgba(124,92,255,0.35)",
      },
      backgroundImage: {
        "aurora": "radial-gradient(circle at 20% 20%, rgba(124,92,255,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.14), transparent 40%), radial-gradient(circle at 50% 100%, rgba(251,191,36,0.08), transparent 40%)",
      },
    },
  },
  plugins: [],
};
