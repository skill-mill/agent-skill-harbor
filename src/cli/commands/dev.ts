import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { packageRoot, userRoot } from '../paths.js';
import { getExitCode, stageDataAssets } from '../utils.js';

const require = createRequire(import.meta.url);
const viteCli = resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js');

export function runDevCommand(): void {
	console.log('Starting development server...');
	console.log(`  Project root: ${userRoot}`);

	const { cleanup } = stageDataAssets(packageRoot, userRoot);
	try {
		execFileSync(process.execPath, [viteCli, 'dev'], {
			cwd: packageRoot,
			stdio: 'inherit',
			env: {
				...process.env,
				SKILL_HARBOR_PROJECT_ROOT: userRoot,
			},
		});
	} catch (error) {
		process.exit(getExitCode(error));
	} finally {
		cleanup();
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	runDevCommand();
}
