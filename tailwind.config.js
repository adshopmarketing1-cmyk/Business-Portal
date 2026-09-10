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
          bg: '#000000',
          card: '#08090E',
          hover: '#10121C',
          subtle: '#0D0E16',
          border: 'rgba(255, 255, 255, 0.09)'
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: 'rgba(99, 102, 241, 0.16)'
        },
        emerald: {
          accent: '#10B981',
          light: 'rgba(16, 185, 129, 0.16)'
        },
        amber: {
          accent: '#F59E0B',
          light: 'rgba(245, 158, 11, 0.16)'
        },
        rose: {
          accent: '#EF4444',
          light: 'rgba(239, 68, 68, 0.16)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
