import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { packageRoot, userRoot } from '../paths.js';
import { loadOptionalEnvFile } from '../env.js';

const envFile = resolve(userRoot, '.env');

if (!existsSync(envFile)) {
	console.warn('Warning: No .env file found. Make sure GH_TOKEN and GH_ORG are set if needed.');
} else {
	loadOptionalEnvFile(envFile);
}

console.log(`Auditing skills...`);
console.log(`  Project root: ${userRoot}`);

process.env.SKILL_HARBOR_ROOT = userRoot;
const runtimeScript = resolve(packageRoot, 'dist/src/runtime/audit-skills.js');

try {
	execFileSync(process.execPath, [runtimeScript, ...process.argv.slice(3)], {
		cwd: userRoot,
		stdio: 'inherit',
		env: process.env,
	});
} catch (error: any) {
	process.exit(error.status ?? 1);
}
