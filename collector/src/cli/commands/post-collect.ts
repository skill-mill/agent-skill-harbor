import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runPostCollectCli } from '../../runtime/post-collect.js';
import { loadOptionalEnvFile } from '../env.js';
import { logCliErrorAndExit } from '../errors.js';
import { userRoot } from '../paths.js';

export async function runCommand(argv: string[] = []): Promise<void> {
	console.log(`Running post_collect plugins...`);
	console.log(`  Project root: ${userRoot}`);

	try {
		const envFile = resolve(userRoot, '.env');
		loadOptionalEnvFile(envFile);
		await runPostCollectCli(argv);
	} catch (error: unknown) {
		logCliErrorAndExit(error);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await runCommand(process.argv.slice(2));
}
