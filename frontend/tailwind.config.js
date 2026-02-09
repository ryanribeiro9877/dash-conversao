/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'status-roxo': '#9333ea',
        'status-azul': '#3b82f6',
        'status-verde': '#22c55e',
        'status-vermelho': '#ef4444',
        'status-laranja': '#f97316',
        'status-branco': '#9ca3af',
      },
    },
  },
  plugins: [],
}
