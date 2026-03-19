import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadCatalog } from './catalog-store.js';
import { runPostCollect } from './post-collect/run-post-collect.js';

function getProjectRoot(): string {
	return process.env.SKILL_HARBOR_ROOT || join(import.meta.dirname, '..', '..');
}

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
	if (process.env.GH_ORG) return process.env.GH_ORG;
	try {
		const remoteUrl = execSync('git remote get-url origin', {
			encoding: 'utf-8',
			cwd: projectRoot,
		}).trim();
		const sshMatch = remoteUrl.match(/^git@[^:]+:([^/]+)\/([^/.]+)/);
		if (sshMatch) return sshMatch[1];
		const httpsMatch = remoteUrl.match(/^https?:\/\/[^/]+\/([^/]+)\/([^/.]+)/);
		if (httpsMatch) return httpsMatch[1];
	} catch {
		// git command failed
	}
	return undefined;
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
