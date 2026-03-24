import { execSync } from 'node:child_process';

export interface GitHubRemote {
	org: string;
	repo: string;
}

export function getProjectRoot(): string {
	return process.env.SKILL_HARBOR_PROJECT_ROOT || process.cwd();
}

export function parseGitHubRemoteUrl(remoteUrl: string): GitHubRemote | null {
	const trimmed = remoteUrl.trim();
	const sshMatch = trimmed.match(/^git@[^:]+:([^/]+)\/(.+?)(?:\.git)?$/);
	if (sshMatch) {
		return { org: sshMatch[1], repo: sshMatch[2] };
	}

	const httpsMatch = trimmed.match(/^https?:\/\/[^/]+\/([^/]+)\/(.+?)(?:\.git)?\/?$/);
	if (httpsMatch) {
		return { org: httpsMatch[1], repo: httpsMatch[2] };
	}

	return null;
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
