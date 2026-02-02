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
        // Core dark palette
        base: '#0a0a0f',
        elevated: '#0f1015',
        card: {
          DEFAULT: 'rgba(15, 16, 22, 0.8)',
          hover: 'rgba(20, 22, 30, 0.9)',
        },
        
        // Accent colors
        coral: {
          DEFAULT: '#e85a4f',
          muted: '#c94a40',
          light: '#f07167',
        },
        teal: {
          DEFAULT: '#4fd1c5',
          muted: '#38b2a5',
          light: '#81e6d9',
        },
        
        // Text colors
        primary: '#e8e8ed',
        secondary: '#9898a8',
        muted: '#5a5a6e',
        
        // Border colors
        subtle: 'rgba(88, 88, 110, 0.2)',
        border: 'rgba(88, 88, 110, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'glow-coral': '0 0 30px rgba(232, 90, 79, 0.15)',
        'glow-teal': '0 0 30px rgba(79, 209, 197, 0.15)',
        'card': '0 4px 30px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #0d0d18 25%, #12101f 50%, #150d1a 75%, #0a0a0f 100%)',
        'space-radial': 'radial-gradient(ellipse at 50% 0%, rgba(79, 209, 197, 0.05) 0%, rgba(139, 92, 246, 0.03) 40%, transparent 70%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
