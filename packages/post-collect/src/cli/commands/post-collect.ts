import { pathToFileURL } from 'node:url';
import { runPostCollectCli } from '../../runtime/post-collect.js';
import { userRoot } from '../paths.js';

export async function runCommand(argv: string[] = process.argv.slice(3)): Promise<void> {
	console.log(`Running post_collect plugins...`);
	console.log(`  Project root: ${userRoot}`);

	process.env.SKILL_HARBOR_ROOT = userRoot;

	try {
		await runPostCollectCli(argv);
	} catch (e: any) {
		process.exit(e.status ?? 1);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await runCommand();
}
