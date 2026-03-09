import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	envDir: process.env.SKILL_HARBOR_ROOT || resolve(import.meta.dirname, '..'),
	define: {
		__PROJECT_ROOT__: JSON.stringify(process.env.SKILL_HARBOR_ROOT || resolve(import.meta.dirname, '..')),
	},
	ssr: { external: ['gray-matter'] },
});
