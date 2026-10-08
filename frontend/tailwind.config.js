/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F8F5F0',
        ink: '#171717',
        gold: {
          DEFAULT: '#C9A86A',
          dark: '#A98A50',
          light: '#E4D3AE',
        },
        taupe: '#D8CFC3',
        burgundy: {
          DEFAULT: '#6B1F2A',
          dark: '#551822',
          light: '#8A3A46',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 23, 23, 0.04), 0 8px 24px rgba(23, 23, 23, 0.06)',
        lift: '0 12px 32px rgba(23, 23, 23, 0.12)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
