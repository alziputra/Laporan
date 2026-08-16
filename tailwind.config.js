/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pegadaian: {
          50: '#f0f9f1',
          100: '#dcf2df',
          200: '#bce4c3',
          300: '#90cf9c',
          400: '#5fb36f',
          500: '#38964b',
          600: '#2a783a', // Main Pegadaian Green #2A783A / #2E7D32
          700: '#236030',
          800: '#1f4d29',
          900: '#1a4023',
          dark: '#1e3a24',
        },
      },
    },
  },
  plugins: [],
};
