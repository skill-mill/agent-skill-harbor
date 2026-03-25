import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STAGED_MARKER_FILE = '.skill-harbor-staged';
const __dirname = dirname(fileURLToPath(import.meta.url));

function resolvePackageRoot(): string {
	let dir = __dirname;
	for (let i = 0; i < 5; i++) {
		if (existsSync(resolve(dir, 'package.json')) && existsSync(resolve(dir, 'templates'))) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error('Failed to resolve package root.');
}

export const packageRoot = resolvePackageRoot();
export const userRoot = resolve(process.env.SKILL_HARBOR_PROJECT_ROOT || process.cwd());

export function getExitCode(error: unknown): number {
	return typeof error === 'object' && error && 'status' in error && typeof error.status === 'number' ? error.status : 1;
}

export function stageDataAssets(packageRootDir: string, userRootDir: string): { cleanup: () => void } {
	const staticAssetsDir = resolve(packageRootDir, 'static', 'assets');
	const dataAssetsDir = resolve(userRootDir, 'data', 'assets');
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
