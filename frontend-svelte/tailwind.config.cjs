const colors = require('tailwindcss/colors')

module.exports = {
  purge: ['./src/**/*.svelte', './src/**/*.css'],
  mode: 'jit',
  darkMode: false,
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
      gray: colors.warmGray,
      blue: colors.sky
    }
  },
  variants: {
    extend: {inset: ['active']}
  },
  plugins: []
}
