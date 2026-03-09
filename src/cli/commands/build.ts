import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { webRoot, userRoot } from '../paths.js';

const args = process.argv.slice(3);
const basePath = args.find((a) => a.startsWith('--base='))?.split('=')[1] ?? '';
const outputDir = resolve(userRoot, 'build');

console.log(`Building web catalog...`);
console.log(`  Project root: ${userRoot}`);
console.log(`  Output:       ${outputDir}`);

try {
	execFileSync('npx', ['vite', 'build'], {
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
}
