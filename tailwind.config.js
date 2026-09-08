/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        polar: {
          950: '#030712',
          900: '#070d1e',
          850: '#0b132b',
          800: '#111d3d',
          750: '#17274f',
          700: '#1c3162',
          600: '#254487',
          500: '#3461bd',
        },
        cyan: {
          neon: '#00f3ff',
          glow: '#38bdf8',
          dim: '#0284c7',
        },
        emerald: {
          neon: '#10e796',
          dark: '#064e3b',
        },
        amber: {
          neon: '#ffb703',
          dark: '#78350f',
        },
        rose: {
          neon: '#ff2a5f',
          dark: '#881337',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'glow-cyan': 'glowCyan 2s ease-in-out infinite alternate',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glowCyan: {
          '0%': { boxShadow: '0 0 5px rgba(0, 243, 255, 0.2), inset 0 0 5px rgba(0, 243, 255, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(0, 243, 255, 0.5), inset 0 0 10px rgba(0, 243, 255, 0.2)' },
        }
      }
    },
  },
  plugins: [],
}

