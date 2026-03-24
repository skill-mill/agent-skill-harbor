import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { logCliErrorAndExit } from '../errors.js';
import { loadOptionalEnvFile } from '../env.js';
import { runCollectOrgSkills } from '../../runtime/collect-org-skills.js';
import { userRoot } from '../paths.js';

export function parseArgs(argv: string[]): { force: boolean } {
	let force = false;

	for (const arg of argv) {
		if (arg === '--force') {
			force = true;
			continue;
		}
		throw new Error(`Unknown option: ${arg}`);
	}

	return { force };
}

export async function runCommand(argv: string[] = []): Promise<void> {
	try {
		const args = parseArgs(argv);
		const envFile = resolve(userRoot, '.env');

		if (!existsSync(envFile)) {
			console.warn('Warning: No .env file found. Make sure GH_TOKEN and GH_ORG are set.');
		} else {
			loadOptionalEnvFile(envFile);
		}

		console.log(`Collecting skills...`);
		console.log(`  Project root: ${userRoot}`);
		if (args.force) {
			console.log(`  Force:        enabled`);
		}

		await runCollectOrgSkills({ force: args.force });
	} catch (error: unknown) {
		logCliErrorAndExit(error);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await runCommand(process.argv.slice(2));
}
