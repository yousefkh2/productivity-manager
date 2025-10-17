/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'focus': {
          black: '#0a0a0a',
          gray: '#1a1a1a',
          border: '#2a2a2a',
        },
        'time-red': '#ef4444',
        'focus-green': '#22c55e',
        'plan-blue': '#3b82f6',
        'insight-purple': '#a855f7',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
