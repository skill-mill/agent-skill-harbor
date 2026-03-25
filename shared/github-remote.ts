export interface GitHubRemote {
	org: string;
	repo: string;
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
