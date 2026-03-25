import { execSync } from 'node:child_process';
import { parseGitHubRemoteUrl } from '../../../../shared/github-remote.js';

export { parseGitHubRemoteUrl } from '../../../../shared/github-remote.js';

export function getProjectRoot(): string {
	return process.env.SKILL_HARBOR_PROJECT_ROOT || process.cwd();
}

export function detectGitHubOrigin(projectRoot: string): { org: string | null; repo: string | null } {
	let org = process.env.GH_ORG || null;
	let repo = process.env.GH_REPO || null;
	if (org && repo) return { org, repo };

	try {
		const remoteUrl = execSync('git remote get-url origin', {
			encoding: 'utf-8',
			cwd: projectRoot,
		}).trim();
		const parsed = parseGitHubRemoteUrl(remoteUrl);
		if (parsed) {
			org = org ?? parsed.org;
			repo = repo ?? parsed.repo;
		}
	} catch {
		// git command failed
	}

	return { org, repo };
}
