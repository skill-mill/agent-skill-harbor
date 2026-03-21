import { dirname, resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { webPackageRequire, webRoot, userRoot } from '../paths.js';

const args = process.argv.slice(3);
const basePath = args.find((a) => a.startsWith('--base='))?.split('=')[1] ?? '';
const outputDir = resolve(userRoot, 'build');
const viteCli = resolve(dirname(webPackageRequire.resolve('vite/package.json')), 'bin/vite.js');

console.log(`Building web catalog...`);
console.log(`  Project root: ${userRoot}`);
console.log(`  Output:       ${outputDir}`);

const staticAssetsDir = resolve(webRoot, 'static', 'assets');
const dataAssetsDir = resolve(userRoot, 'data', 'assets');
rmSync(staticAssetsDir, { recursive: true, force: true });
if (existsSync(dataAssetsDir)) {
	cpSync(dataAssetsDir, staticAssetsDir, { recursive: true });
	writeFileSync(resolve(staticAssetsDir, '.skill-harbor-staged'), 'staged\n');
}

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
	console.log(`\nBuild complete! Output in ${outputDir}`);
} catch (e: any) {
	process.exit(e.status ?? 1);
} finally {
	rmSync(staticAssetsDir, { recursive: true, force: true });
}
