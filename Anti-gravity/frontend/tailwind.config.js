/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          900: '#0b0f19', // Very dark slate/navy
          800: '#111827', // Slate-900 equivalent
          700: '#1f2937', // Slate-800 equivalent
          gold: '#d97706', // Gold accents
          crimson: '#b91c1c', // Crimson accent
          emerald: '#059669', // Emerald/green
        }
      }
    },
  },
  plugins: [],
}
