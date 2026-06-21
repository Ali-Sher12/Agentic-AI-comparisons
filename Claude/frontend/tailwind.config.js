/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Ledger / official record palette
        ink: {
          DEFAULT: "#1F2421",
          light: "#3A4039",
        },
        paper: {
          DEFAULT: "#F7F3EA",
          dark: "#EDE6D6",
          card: "#FFFDF8",
        },
        seal: {
          DEFAULT: "#0B3D2E", // official deep green
          light: "#14533F",
          dark: "#072A20",
        },
        brass: {
          DEFAULT: "#A87C1F", // muted gold, seal/stamp accent
          light: "#C49A3F",
          dark: "#7D5C16",
        },
        maroon: {
          DEFAULT: "#7A1F2B", // irreversible / destructive actions
          dark: "#5C1620",
        },
        sage: {
          DEFAULT: "#4A7856", // success / returned status
          light: "#E4EDE3",
        },
      },
      fontFamily: {
        display: ["'Source Serif 4'", "'Georgia'", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31, 36, 33, 0.06), 0 4px 12px rgba(31, 36, 33, 0.08)",
        stamp: "0 2px 8px rgba(11, 61, 46, 0.25)",
      },
      backgroundImage: {
        "paper-texture":
          "radial-gradient(circle at 1px 1px, rgba(31,36,33,0.035) 1px, transparent 0)",
      },
      backgroundSize: {
        "paper-grid": "18px 18px",
      },
    },
  },
  plugins: [],
};
