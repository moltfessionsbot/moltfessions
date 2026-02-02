import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // mempool.space inspired dark palette
        background: '#11181f',
        surface: '#1d2d3a',
        accent: '#4fc3f7',
        confirmed: '#4ecca3',
        pending: '#ffc107',
        border: '#2d4a5a',
        muted: '#6b9dad',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
