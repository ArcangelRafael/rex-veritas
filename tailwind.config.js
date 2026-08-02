/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ESTO ES NUEVO: Habilita el modo oscuro manual por clases
  theme: {
    extend: {},
  },
  plugins: [],
}