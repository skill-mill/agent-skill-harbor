import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadOptionalEnvFile, logRuntimeErrorAndExit } from '../shared/runtime-command-support.js';
import { userRoot } from '../shared/runtime-paths.js';
import { runPostCollectCli } from './post-collect.js';

export async function runPostCollectCommand(argv: string[] = []): Promise<void> {
	console.log('Running post_collect plugins...');
	console.log(`  Project root: ${userRoot}`);

	try {
		const envFile = resolve(userRoot, '.env');
		loadOptionalEnvFile(envFile);
		await runPostCollectCli(argv);
	} catch (error: unknown) {
		logRuntimeErrorAndExit(error);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await runPostCollectCommand(process.argv.slice(2));
}
