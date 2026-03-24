import { pathToFileURL } from 'node:url';
import { loadCatalog } from './shared/catalog-store.js';
import { detectGitHubOrigin, getProjectRoot } from './shared/project.js';
import { runPostCollect } from './post-collect/run-post-collect.js';

function parseArgs(argv: string[]): { collectId?: string } {
	let collectId: string | undefined;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--collect-id') {
			collectId = argv[i + 1];
			i++;
			continue;
		}
		throw new Error(`Unknown option: ${arg}`);
	}
	return { collectId };
}

export function resolveOrgName(projectRoot: string): string | undefined {
	return detectGitHubOrigin(projectRoot).org ?? undefined;
}

export async function runPostCollectCli(argv: string[] = process.argv.slice(2)): Promise<void> {
	const args = parseArgs(argv);
	const projectRoot = getProjectRoot();
	await runPostCollect({
		projectRoot,
		collectId: args.collectId ?? null,
		orgName: resolveOrgName(projectRoot),
		catalog: loadCatalog(projectRoot),
		log: true,
	});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await runPostCollectCli(process.argv.slice(2));
}
