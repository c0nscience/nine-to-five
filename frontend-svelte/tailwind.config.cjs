const colors = require('tailwindcss/colors')

module.exports = {
    purge: ['./src/**/*.svelte', './src/**/*.css'],
    darkMode: false,
    theme: {
        fontFamily: {
            display: ['Roboto Mono', 'Menlo', 'monospace'],
            body: ['Roboto Mono', 'Menlo', 'monospace'],
        },
    },
    variants: {
        extend: { inset: ['active'] },
    },
    plugins: [],
}