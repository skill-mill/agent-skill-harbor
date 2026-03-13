import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { webPackageRequire, webRoot, userRoot } from '../paths.js';

const viteCli = resolve(dirname(webPackageRequire.resolve('vite/package.json')), 'bin/vite.js');

console.log(`Starting preview server...`);
console.log(`  Project root: ${userRoot}`);

try {
	execFileSync(process.execPath, [viteCli, 'preview'], {
		cwd: webRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			SKILL_HARBOR_ROOT: userRoot,
		},
	});
} catch (e: any) {
	process.exit(e.status ?? 1);
}
