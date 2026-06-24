/** @type {import('tailwindcss').Config} */
// Build de producción de la landing (sustituye al Play CDN).
// Compilar con la CLI standalone:  tailwindcss -i tailwind.input.css -o landing/tailwind.css --minify
module.exports = {
  content: ['./landing/**/*.html', './landing/**/*.js'],
  theme: {
    extend: {
      fontFamily: { display: ['"Plus Jakarta Sans"', 'sans-serif'], sans: ['Inter', 'sans-serif'] },
      colors: {
        brand: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b' },
        ink: { 900:'#070b16',800:'#0b1220',700:'#1f2937',500:'#64748b',400:'#94a3b8' },
      },
    },
  },
  plugins: [],
};
