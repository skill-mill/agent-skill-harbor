import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { webPackageRequire, webRoot, userRoot } from '../paths.js';

const args = process.argv.slice(3);
const basePath = args.find((a) => a.startsWith('--base='))?.split('=')[1] ?? '';
const outputDir = resolve(userRoot, 'build');
const viteCli = resolve(dirname(webPackageRequire.resolve('vite/package.json')), 'bin/vite.js');

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
} catch (e: any) {
	process.exit(e.status ?? 1);
}
