import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const STAGED_MARKER_FILE = '.skill-harbor-staged';

export function getExitCode(error: unknown): number {
	return typeof error === 'object' && error && 'status' in error && typeof error.status === 'number' ? error.status : 1;
}

export function stageDataAssets(packageRoot: string, userRoot: string): { cleanup: () => void } {
	const staticAssetsDir = resolve(packageRoot, 'static', 'assets');
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
