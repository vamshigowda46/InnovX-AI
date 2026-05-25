/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#7C3AED',
          secondary: '#06B6D4',
          accent: '#EC4899',
        },
        surface: { DEFAULT: '#F8FAFC', card: '#FFFFFF' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 4px 24px rgba(124, 58, 237, 0.08)',
        glow: '0 0 40px rgba(124, 58, 237, 0.2)',
        neon: '0 0 60px rgba(124, 58, 237, 0.35)',
      },
      animation: {
        'gradient-shift': 'gradientShift 6s ease infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
