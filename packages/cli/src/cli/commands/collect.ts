import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { packageRoot, userRoot } from '../paths.js';
import { loadOptionalEnvFile } from '../env.js';

const envFile = resolve(userRoot, '.env');

if (!existsSync(envFile)) {
	console.warn('Warning: No .env file found. Make sure GH_TOKEN and GH_ORG are set.');
} else {
	loadOptionalEnvFile(envFile);
}

console.log(`Collecting skills...`);
console.log(`  Project root: ${userRoot}`);

process.env.SKILL_HARBOR_ROOT = userRoot;
const runtimeScript = resolve(packageRoot, 'dist/src/runtime/collect-org-skills.js');

try {
	execFileSync(process.execPath, [runtimeScript], {
		cwd: userRoot,
		stdio: 'inherit',
		env: process.env,
	});
} catch (e: any) {
	process.exit(e.status ?? 1);
}
