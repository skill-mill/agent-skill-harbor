import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getExitCode, packageRoot, stageDataAssets, userRoot } from '../shared/runtime-support.js';

const require = createRequire(import.meta.url);

export function runBuild(argv: string[] = []): void {
	const basePath = argv.find((arg) => arg.startsWith('--base='))?.split('=')[1] ?? '';
	const outputDir = resolve(userRoot, 'build');
	const viteCli = resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js');

	console.log('Building web catalog...');
	console.log(`  Project root: ${userRoot}`);
	console.log(`  Output:       ${outputDir}`);

	const { cleanup } = stageDataAssets(packageRoot, userRoot);
	try {
		execFileSync(process.execPath, [viteCli, 'build'], {
			cwd: packageRoot,
			stdio: 'inherit',
			env: {
				...process.env,
				SKILL_HARBOR_PROJECT_ROOT: userRoot,
				SKILL_HARBOR_OUTPUT_DIR: outputDir,
				...(basePath ? { BASE_PATH: basePath } : {}),
			},
		});
		console.log(`\nBuild complete! Output in ${outputDir}`);
	} catch (error) {
		process.exit(getExitCode(error));
	} finally {
		cleanup();
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	runBuild(process.argv.slice(2));
}
