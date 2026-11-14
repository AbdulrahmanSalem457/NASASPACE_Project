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
        space: {
          950: '#030712',
          900: '#0B0F19',
          850: '#0F172A',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
          500: '#4B5563',
        },
        nasa: {
          blue: '#0B3D91',
          red: '#FC3D21',
          cyan: '#38BDF8',
          accent: '#2563EB',
        },
        alert: {
          normal: '#10B981',    // Green
          notice: '#3B82F6',    // Blue
          warning: '#F59E0B',   // Yellow/Amber
          critical: '#EF4444',  // Red
          emergency: '#DC2626', // Flashing Red
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        pulseFast: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.03)' },
        },
        flashSiren: {
          '0%, 100%': { backgroundColor: 'rgba(220, 38, 38, 0.4)' },
          '50%': { backgroundColor: 'rgba(239, 68, 68, 0.95)' },
        }
      },
      animation: {
        'pulse-fast': 'pulseFast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-siren': 'flashSiren 0.8s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
