// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // NOT 'media' — so it's not automatic
  theme: {
    extend: {},
  },
  plugins: [],
};
