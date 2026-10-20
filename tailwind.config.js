/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'short': { 'raw': '(max-height: 650px)' },
        '3xl': '1920px',
      },
      colors: {
        primary: {
          50: '#EFF3FB',
          100: '#929CB7',
          300: '#9DB9FF',
          500: '#195791',
          600: '#201E1E',
          700: '#D9D9D9',
          800: '#201E1E'
        },
        warm: {
          50: '#FBF3E8',
          100: '#F0DFC2',
          300: '#DCB77E',
          500: '#B5793C',
          600: '#3D2F1F',
          700: '#5A4630',
          800: '#2E2418',
        },
      },
      fontFamily:{
        roboto: ['Roboto', 'sans-serif'],
        orbitron:['Orbitron', 'sans-serif'],
        fustat:['Fustat', 'sans-serif'],
        inter:['Inter', 'sans-serif'],
        kapakana:['Kapakana', 'cursive'],
        intelOneMono: ['"Intel One Mono"', 'monospace'],
        monomaniac: ['"Monomaniac One"', 'sans-serif'],

      }
    },
  },
  plugins: [
    require('tailwindcss/plugin')(({ addVariant }) => {
      addVariant('warm', '[data-theme="warm"] &')
    }),
  ],
}