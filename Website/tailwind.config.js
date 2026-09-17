/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF8F5',
          200: '#F4EFE6',
          300: '#E8DEC8',
          400: '#D4C3A3',
          500: '#C5A880',
        },
        navy: {
          800: '#0F2238',
          900: '#0B192C',
          950: '#07101C',
        },
        ochre: {
          500: '#C59B27',
          600: '#A47E1B',
          700: '#866412',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        gujarati: ['"Noto Serif Gujarati"', '"Playfair Display"', 'serif'],
        hindi: ['"Noto Serif Devanagari"', '"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
};
