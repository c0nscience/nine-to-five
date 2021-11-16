import vercel from '@sveltejs/adapter-vercel'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
    target: '#svelte',
    ssr: false,
    adapter: vercel()
  }
};

export default config;
