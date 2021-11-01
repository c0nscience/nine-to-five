import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		target: '#svelte',
		ssr: false,
    adapter: adapter({
      fallback: 'index.html'
    }),
	}
};

export default config;
