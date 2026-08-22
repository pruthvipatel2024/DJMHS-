/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50, #F0F4FC)',
          100: 'var(--color-primary-100, #D9E3F7)',
          200: 'var(--color-primary-200, #B8CBED)',
          300: 'var(--color-primary-300, #8BAEE0)',
          400: 'var(--color-primary-400, #5A8BD1)',
          500: 'var(--color-primary-500, #174CB8)', // Lighter version of primary
          600: 'var(--color-primary-600, #123E97)', /* DJMHS Primary Blue */
          700: 'var(--color-primary-700, #0B2D78)', /* DJMHS Secondary Blue */
          800: 'var(--color-primary-800, #08225A)',
          900: 'var(--color-primary-900, #05163C)',
        },
        accent: {
          50: 'var(--color-accent-50, #FFFAEB)',
          100: 'var(--color-accent-100, #FFF0C2)',
          200: 'var(--color-accent-200, #F7E7B5)', /* DJMHS Light Gold */
          300: 'var(--color-accent-300, #FFD347)',
          400: 'var(--color-accent-400, #FFC51A)',
          500: 'var(--color-accent-500, #F2B233)', /* DJMHS Golden Accent */
          600: 'var(--color-accent-600, #C98200)',
          700: 'var(--color-accent-700, #9E6300)',
          800: 'var(--color-accent-800, #7A4B00)',
          900: 'var(--color-accent-900, #573300)',
        },
        surface: '#FFFFFF',
        subtle: '#F8FAFC',
      },
      fontFamily: {
        sans: ['var(--font-sans, Inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(29, 78, 216, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 10px 25px -5px rgba(29, 78, 216, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
};
