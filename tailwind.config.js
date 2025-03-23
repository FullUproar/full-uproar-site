module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'neon-pink': '#FF007F',
          'neon-green': '#39FF14',
          'electric-blue': '#00FFFF',
        },
        fontFamily: {
          display: ['"Anton"', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }
  