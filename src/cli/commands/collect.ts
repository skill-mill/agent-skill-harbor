import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packageRoot, userRoot } from '../paths.js';

const envFile = resolve(userRoot, '.env');

if (!existsSync(envFile)) {
	console.warn('Warning: No .env file found. Make sure GH_TOKEN and GH_ORG are set.');
} else {
	loadOptionalEnvFile(envFile);
}

console.log(`Collecting skills...`);
console.log(`  Project root: ${userRoot}`);

function loadOptionalEnvFile(filePath: string): void {
	for (const rawLine of readFileSync(filePath, 'utf-8').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
		const separator = normalized.indexOf('=');
		if (separator <= 0) continue;

		const key = normalized.slice(0, separator).trim();
		if (!key || process.env[key] !== undefined) continue;

		let value = normalized.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		process.env[key] = value.replace(/\\n/g, '\n');
	}
}

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
