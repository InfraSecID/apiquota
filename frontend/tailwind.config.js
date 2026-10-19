/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          surface: '#121212',
          border: '#262626',
          card: '#161616',
        },
        neon: {
          green: '#00ff88',
          emerald: '#10b981',
          blue: '#3b82f6',
          cyan: '#06b6d4',
        },
        brand: {
          50: '#f0fdf4',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
    },
  },
  plugins: [],
}
