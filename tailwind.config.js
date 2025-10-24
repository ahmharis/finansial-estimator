/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Meskipun kita tidak punya folder components, ini adalah best practice
  ],
  theme: {
    extend: {
      // Anda bisa menambahkan kustomisasi tema di sini
    },
  },
  plugins: [],
}

