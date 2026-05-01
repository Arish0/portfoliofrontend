import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './admin.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#090a0d',
        'cyber-panel': 'rgba(24, 23, 29, 0.92)',
        'cyber-text': '#f7efe4',
        'cyber-muted': '#b5adbd',
        'cyber-accent': '#ff9d2e',
        'cyber-violet': '#6d5bff',
        'cyber-teal': '#22d3c5',
      },
      fontFamily: {
        'syne': ['Syne', 'sans-serif'],
        'dm-mono': ["'DM Mono'", 'monospace'],
      },
      opacity: {
        3: '0.03',
        4: '0.04',
        8: '0.08',
        12: '0.12',
        18: '0.18',
        35: '0.35',
      },
    },
  },
  plugins: [],
} satisfies Config;
