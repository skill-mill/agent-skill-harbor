import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getExitCode, packageRoot, userRoot } from '../shared/runtime-support.js';

const require = createRequire(import.meta.url);
const viteCli = resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js');

export function runPreview(): void {
	console.log('Starting preview server...');
	console.log(`  Project root: ${userRoot}`);

	try {
		execFileSync(process.execPath, [viteCli, 'preview'], {
			cwd: packageRoot,
			stdio: 'inherit',
			env: {
				...process.env,
				SKILL_HARBOR_PROJECT_ROOT: userRoot,
			},
		});
	} catch (error) {
		process.exit(getExitCode(error));
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	runPreview();
}
