import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

const require = createRequire(import.meta.url);
const projectRoot = realpathSync(process.env.SKILL_HARBOR_PROJECT_ROOT || resolve(import.meta.dirname));
const webPackageRoot = realpathSync(resolve(import.meta.dirname));
const svelteKitRoot = realpathSync(dirname(require.resolve('@sveltejs/kit/package.json')));
const viteRoot = realpathSync(dirname(require.resolve('vite/package.json')));
const allowList = [
	searchForWorkspaceRoot(projectRoot),
	projectRoot,
	join(projectRoot, 'node_modules'),
	webPackageRoot,
	svelteKitRoot,
	viteRoot,
];

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	envDir: projectRoot,
	define: {
		__PROJECT_ROOT__: JSON.stringify(projectRoot),
		__WEB_PACKAGE_ROOT__: JSON.stringify(webPackageRoot),
	},
	server: {
		fs: {
			allow: allowList,
		},
	},
	ssr: { external: ['gray-matter'] },
});
