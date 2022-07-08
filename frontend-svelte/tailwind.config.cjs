const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./src/**/*.svelte', './src/**/*.css'],
  theme: {
    fontFamily: {
      display: ['Roboto Mono', 'Menlo', 'monospace'],
      body: ['Roboto Mono', 'Menlo', 'monospace']
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.stone,
      blue: colors.sky,
      red: colors.red,// use a purple for secondary highlight maybe
    },
    extend: {
      zIndex: {
        '-1': '-1',
      }
    }
  },
  plugins: []
}
