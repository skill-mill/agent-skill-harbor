import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const STAGED_MARKER_FILE = '.skill-harbor-staged';

/**
 * These command modules are shipped directly via package exports without a
 * separate package build step, so they intentionally stay in plain ESM.
 *
 * @param {unknown} error
 * @returns {number}
 */
export function getExitCode(error) {
	return typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
		? error.status
		: 1;
}

/**
 * Stages user-provided data/assets into web/static/assets so SvelteKit can
 * serve them during dev and prerender.
 *
 * @param {string} webRoot
 * @param {string} userRoot
 * @returns {{ cleanup: () => void }}
 */
export function stageDataAssets(webRoot, userRoot) {
	const staticAssetsDir = resolve(webRoot, 'static', 'assets');
	const dataAssetsDir = resolve(userRoot, 'data', 'assets');
	rmSync(staticAssetsDir, { recursive: true, force: true });
	if (!existsSync(dataAssetsDir)) {
		return { cleanup: () => {} };
	}
	cpSync(dataAssetsDir, staticAssetsDir, { recursive: true });
	writeFileSync(resolve(staticAssetsDir, STAGED_MARKER_FILE), 'staged\n');

	return {
		cleanup: () => {
			rmSync(staticAssetsDir, { recursive: true, force: true });
		},
	};
}
