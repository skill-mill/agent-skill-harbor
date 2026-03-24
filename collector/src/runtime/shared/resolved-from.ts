import { basename } from 'node:path';

export interface ProjectSkillsLockEntry {
	source?: string;
	sourceType?: string;
	computedHash?: string;
}

interface ProjectSkillsLockFile {
	version?: number;
	skills?: Record<string, ProjectSkillsLockEntry>;
}

interface ParsedRepoRef {
	owner: string;
	repo: string;
	sha: string | null;
}

export interface ParsedResolvedFrom {
	platform: string;
	owner: string;
	repo: string;
	repoKey: string;
	sha: string | null;
}

const DEFAULT_PLATFORM = 'github.com';

export function normalizeRepoKey(platform: string, owner: string, repo: string): string {
	return `${platform}/${owner}/${repo}`;
}

function parseRepoRef(from: string): ParsedRepoRef | null {
	const match = from.trim().match(/^([^/\s]+)\/([^@\s]+)(?:@(.+))?$/);
	if (!match) return null;
	return {
		owner: match[1],
		repo: match[2],
		sha: match[3] ?? null,
	};
}

export function parseResolvedFromRef(from: string): ParsedResolvedFrom | null {
	const match = from.trim().match(/^([^/\s]+)\/([^/\s]+)\/([^@\s]+)(?:@(.+))?$/);
	if (!match) return null;
	return {
		platform: match[1],
		owner: match[2],
		repo: match[3],
		repoKey: normalizeRepoKey(match[1], match[2], match[3]),
		sha: match[4] ?? null,
	};
}

export function normalizeResolvedFromFrontmatter(from: unknown, platform = DEFAULT_PLATFORM): string | null {
	const raw =
		typeof from === 'string' ? from : Array.isArray(from) && from.length > 0 ? String(from[from.length - 1]) : null;
	if (!raw) return null;
	const parsed = parseRepoRef(raw);
	if (!parsed) return null;
	return parsed.sha
		? `${platform}/${parsed.owner}/${parsed.repo}@${parsed.sha}`
		: `${platform}/${parsed.owner}/${parsed.repo}`;
}

export function parseProjectSkillsLock(content: string): Map<string, ProjectSkillsLockEntry> {
	try {
		const parsed = JSON.parse(content) as ProjectSkillsLockFile;
		if (!parsed || typeof parsed !== 'object' || !parsed.skills || typeof parsed.skills !== 'object') {
			return new Map();
		}
		return new Map(Object.entries(parsed.skills));
	} catch {
		return new Map();
	}
}

export function resolveSkillLookupName(frontmatter: Record<string, unknown>, skillPath: string): string | null {
	if (typeof frontmatter.name === 'string' && frontmatter.name.trim()) {
		return frontmatter.name.trim();
	}
	const dirName = basename(skillPath.replace(/\/SKILL\.md$/, ''));
	return dirName && dirName !== 'SKILL.md' ? dirName : null;
}

export function normalizeResolvedFromSkillsLock(
	skillName: string | null,
	lockEntries: Map<string, ProjectSkillsLockEntry>,
	platform = DEFAULT_PLATFORM,
): string | null {
	if (!skillName) return null;
	const entry = lockEntries.get(skillName);
	if (!entry || entry.sourceType !== 'github' || typeof entry.source !== 'string') return null;
	const parsed = parseRepoRef(entry.source);
	if (!parsed) return null;
	return `${platform}/${parsed.owner}/${parsed.repo}`;
}
