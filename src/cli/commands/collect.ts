import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { packageRoot, userRoot } from '../paths.js';

const envFile = resolve(userRoot, '.env');

if (!existsSync(envFile)) {
	console.warn('Warning: No .env file found. Make sure GH_TOKEN and GH_ORG are set.');
}

console.log(`Collecting skills...`);
console.log(`  Project root: ${userRoot}`);

const collectScript = resolve(packageRoot, 'scripts/collect-org-skills.ts');

try {
	execFileSync('npx', ['tsx', '--env-file-if-exists=.env', collectScript], {
		cwd: userRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			SKILL_HARBOR_ROOT: userRoot,
		},
	});
} catch (e: any) {
	process.exit(e.status ?? 1);
}
