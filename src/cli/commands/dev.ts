import { execFileSync } from 'node:child_process';
import { webRoot, userRoot } from '../paths.js';

console.log(`Starting development server...`);
console.log(`  Project root: ${userRoot}`);

try {
	execFileSync('npx', ['vite', 'dev'], {
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
