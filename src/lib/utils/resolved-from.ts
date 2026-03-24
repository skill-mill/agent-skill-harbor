import type { FlatSkillEntry } from '$lib/types';

export interface ParsedResolvedFrom {
	platform: string;
	owner: string;
	repo: string;
	sha: string | null;
}

export function parseResolvedFrom(value: string): ParsedResolvedFrom | null {
	const match = value.trim().match(/^([^/\s]+)\/([^/\s]+)\/([^@\s]+)(?:@(.+))?$/);
	if (!match) return null;
	return {
		platform: match[1],
		owner: match[2],
		repo: match[3],
		sha: match[4] ?? null,
	};
}

export function normalizeResolvedFromFrontmatter(from: unknown, platform = 'github.com'): string | null {
	const raw =
		typeof from === 'string' ? from : Array.isArray(from) && from.length > 0 ? String(from[from.length - 1]) : null;
	if (!raw) return null;
	const match = raw.trim().match(/^([^/\s]+)\/([^@\s]+)(?:@(.+))?$/);
	if (!match) return null;
	return match[3] ? `${platform}/${match[1]}/${match[2]}@${match[3]}` : `${platform}/${match[1]}/${match[2]}`;
}

export function getResolvedFrom(skill: FlatSkillEntry): string | null {
	return skill.resolved_from ?? normalizeResolvedFromFrontmatter(skill.frontmatter._from);
}

export function getResolvedFromRepoLabel(skill: FlatSkillEntry): string | null {
	const parsed = getResolvedFromParsed(skill);
	return parsed ? `${parsed.owner}/${parsed.repo}` : null;
}

export function getResolvedFromUrl(skill: FlatSkillEntry): string | null {
	const parsed = getResolvedFromParsed(skill);
	if (!parsed || parsed.platform !== 'github.com') return null;
	if (parsed.sha) {
		return `https://github.com/${parsed.owner}/${parsed.repo}/tree/${parsed.sha}`;
	}
	return `https://github.com/${parsed.owner}/${parsed.repo}`;
}

function getResolvedFromParsed(skill: FlatSkillEntry): ParsedResolvedFrom | null {
	const resolvedFrom = getResolvedFrom(skill);
	if (!resolvedFrom) return null;
	return parseResolvedFrom(resolvedFrom);
}
