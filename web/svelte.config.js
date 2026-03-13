import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

const dev = process.argv.includes('dev');
const projectRoot = process.env.SKILL_HARBOR_ROOT || resolve(import.meta.dirname, '..');
const outputDir = process.env.SKILL_HARBOR_OUTPUT_DIR || 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: outputDir,
			assets: outputDir,
			fallback: '404.html',
			precompress: false,
			strict: false,
		}),
		paths: {
			base: dev ? '' : process.env.BASE_PATH || '',
		},
		prerender: {
			handleMissingId: 'warn',
		},
		env: {
			dir: projectRoot,
		},
	},
};

export default config;
