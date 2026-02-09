/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': {
          DEFAULT: '#380e74',
          50: '#f3eaff',
          100: '#e0ccff',
          200: '#b88aed',
          300: '#8f4fd6',
          400: '#6a2dab',
          500: '#380e74',
          600: '#2d0b5e',
          700: '#220848',
          800: '#170532',
          900: '#0c021c',
        },
        'brand-orange': {
          DEFAULT: '#ff791a',
          50: '#fff4eb',
          100: '#ffe4cc',
          200: '#ffc999',
          300: '#ffad66',
          400: '#ff9240',
          500: '#ff791a',
          600: '#e06000',
          700: '#a84800',
          800: '#703000',
          900: '#381800',
        },
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
