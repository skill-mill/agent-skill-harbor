import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { packageRoot, userRoot } from '../paths.js';

console.log(`Running post_collect plugins...`);
console.log(`  Project root: ${userRoot}`);

process.env.SKILL_HARBOR_ROOT = userRoot;
const runtimeScript = resolve(packageRoot, 'dist/src/runtime/post-collect.js');

try {
	execFileSync(process.execPath, [runtimeScript, ...process.argv.slice(3)], {
		cwd: userRoot,
		stdio: 'inherit',
		env: process.env,
	});
} catch (e: any) {
	process.exit(e.status ?? 1);
}
