import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolvePackageRoot(): string {
	// Walk up from __dirname looking for the directory that contains both
	// package.json and templates/.  The depth varies depending on whether
	// this code runs from source (src/cli/), the standalone built file
	// (dist/src/cli/paths.js), or inlined into another entry such as
	// dist/src/cli/commands/init.js (splitting: false).
	let dir = __dirname;
	for (let i = 0; i < 6; i++) {
		if (existsSync(resolve(dir, 'package.json')) && existsSync(resolve(dir, 'templates'))) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error('Failed to resolve CLI package root.');
}

/** Root of the installed CLI package (where dist/, templates/ live) */
export const packageRoot = resolvePackageRoot();

/** The target Harbor project directory (CWD by default) */
export const userRoot = process.env.SKILL_HARBOR_PROJECT_ROOT || process.cwd();
