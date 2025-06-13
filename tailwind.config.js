module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'blue-light': '#3471B8',
        'blue-dark': '#024A76',
        'yellow-accent': '#E3AB23',
        // Dark mode specific colors
        'dark': {
          bg: '#1a1a1a',
          'bg-secondary': '#2d2d2d',
          'bg-tertiary': '#3a3a3a',
          text: '#f5f5f5',
          'text-secondary': '#d1d5db',
          'text-muted': '#9ca3af',
        }
      }
    },
  },
  plugins: [],
};
