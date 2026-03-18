import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { webRoot, userRoot } from '../paths.js';
import { getExitCode } from '../utils.js';

const require = createRequire(import.meta.url);

export function runBuildCommand(argv = process.argv.slice(3)) {
	const basePath = argv.find((a) => a.startsWith('--base='))?.split('=')[1] ?? '';
	const outputDir = resolve(userRoot, 'build');
	const viteCli = resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js');

	console.log(`Building web catalog...`);
	console.log(`  Project root: ${userRoot}`);
	console.log(`  Output:       ${outputDir}`);

	try {
		execFileSync(process.execPath, [viteCli, 'build'], {
			cwd: webRoot,
			stdio: 'inherit',
			env: {
				...process.env,
				SKILL_HARBOR_ROOT: userRoot,
				SKILL_HARBOR_OUTPUT_DIR: outputDir,
				...(basePath ? { BASE_PATH: basePath } : {}),
			},
		});
		const reportsDir = resolve(userRoot, 'data', 'plugin-reports');
		const buildReportsDir = resolve(outputDir, 'plugin-reports');
		rmSync(buildReportsDir, { recursive: true, force: true });
		if (existsSync(reportsDir)) {
			cpSync(reportsDir, buildReportsDir, { recursive: true });
			console.log(`  Copied plugin reports: ${buildReportsDir}`);
		}
		console.log(`\nBuild complete! Output in ${outputDir}`);
	} catch (error) {
		process.exit(getExitCode(error));
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	runBuildCommand();
}
