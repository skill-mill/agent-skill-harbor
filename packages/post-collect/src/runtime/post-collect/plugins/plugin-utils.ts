import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PostCollectSkillResult } from '../types.js';

interface ParsedSkillKey {
	platform: string;
	owner: string;
	repo: string;
	skillPath: string;
}

function parseSkillKey(skillKey: string): ParsedSkillKey | null {
	const parts = skillKey.split('/');
	if (parts.length < 5) return null;
	const [platform, owner, repo, ...skillPathParts] = parts;
	return {
		platform,
		owner,
		repo,
		skillPath: skillPathParts.join('/'),
	};
}

export function isOrgOwnedSkill(skillKey: string, orgName: string | undefined): boolean {
	if (!orgName) return false;
	return parseSkillKey(skillKey)?.owner === orgName;
}

export function getSkillFilePath(projectRoot: string, skillKey: string): string | null {
	const parsed = parseSkillKey(skillKey);
	if (!parsed) return null;
	return join(projectRoot, 'data', 'skills', parsed.platform, parsed.owner, parsed.repo, parsed.skillPath);
}

export function getSkillDirPath(projectRoot: string, skillKey: string): string | null {
	const skillFilePath = getSkillFilePath(projectRoot, skillKey);
	if (!skillFilePath) return null;
	return skillFilePath.endsWith('/SKILL.md') ? skillFilePath.slice(0, -'/SKILL.md'.length) : skillFilePath;
}

export function readSkillBody(projectRoot: string, skillKey: string): string | null {
	const skillFilePath = getSkillFilePath(projectRoot, skillKey);
	if (!skillFilePath) return null;
	try {
		return readFileSync(skillFilePath, 'utf-8');
	} catch {
		return null;
	}
}

export function buildUnknownResult(raw: string, label = 'Unknown'): PostCollectSkillResult {
	return { label, raw };
}
