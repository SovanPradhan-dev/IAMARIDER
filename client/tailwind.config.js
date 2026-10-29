/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#071c14',
          900: '#0b2a1e',
          800: '#104532',
          700: '#156046',
          600: '#1d7a57',
          500: '#27a16f',
        },
        slate: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
