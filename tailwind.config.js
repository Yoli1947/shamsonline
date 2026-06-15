import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{jsx,tsx}',
    './pages/**/*.{jsx,tsx}',
    './components/**/*.{jsx,tsx,js}',
    './context/**/*.{jsx,tsx}',
    './lib/**/*.{js,ts}',
    './hooks/**/*.{js,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [tailwindcssAnimate],
};
