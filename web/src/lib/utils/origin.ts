import type { FlatSkillEntry } from '$lib/types';
import { getResolvedFrom } from '$lib/utils/resolved-from';

/** A row within an OriginGroup — one unique skill name with its origin + derivatives. */
export interface OriginSkillRow {
	skillName: string;
	/** The origin skill (in the origin repo), if it exists in the catalog. */
	origin: FlatSkillEntry | null;
	/** Derivative copies in other repos. */
	derivatives: FlatSkillEntry[];
}

export interface OriginGroup {
	originKey: string; // "owner/repo"
	isExternal: boolean;
	totalSkills: number;
	uniqueSkills: number;
	rows: OriginSkillRow[];
}

/**
 * Parse normalized resolved_from ("github.com/owner/repo@sha") into owner and repo.
 */
function parseFrom(from: unknown): { owner: string; repo: string } | null {
	const raw = typeof from === 'string' ? from : null;
	if (!raw) return null;
	const match = raw.trim().match(/^[^/\s]+\/([^/\s]+)\/([^@\s]+)(?:@.+)?$/);
	if (!match) return null;
	return { owner: match[1], repo: match[2] };
}

/**
 * Resolve the true origin of a skill by following the `_from` chain.
 *
 * - If `_from` points to the same org, find the matching skill (by name) in that repo and continue.
 * - If `_from` points to an external org, that's the origin.
 * - If no `_from`, the skill's own repo is the origin.
 */
export function resolveOrigin(skill: FlatSkillEntry, allSkills: FlatSkillEntry[], orgName: string): string {
	const skillName = String(skill.frontmatter.name ?? '');
	const visited = new Set<string>();
	let current = skill;

	while (true) {
		const fromRef = parseFrom(getResolvedFrom(current));
		if (!fromRef) {
			return `${current.owner}/${current.repo}`;
		}

		if (fromRef.owner !== orgName) {
			// External origin — stop here
			return `${fromRef.owner}/${fromRef.repo}`;
		}

		// Same org — trace further
		const key = `${fromRef.owner}/${fromRef.repo}`;
		if (visited.has(key)) {
			return `${current.owner}/${current.repo}`;
		}
		visited.add(key);

		const next = allSkills.find(
			(s) => s.owner === fromRef.owner && s.repo === fromRef.repo && String(s.frontmatter.name ?? '') === skillName,
		);
		if (!next) {
			return key;
		}
		current = next;
	}
}

/**
 * Group skills by resolved origin repo.
 * Within each group, skills are further grouped by name into rows,
 * each showing the origin skill and its derivative copies.
 */
export function groupByOrigin(skills: FlatSkillEntry[], allSkills: FlatSkillEntry[], orgName: string): OriginGroup[] {
	// Step 1: group by origin repo
	const repoMap = new Map<string, FlatSkillEntry[]>();
	for (const skill of skills) {
		const origin = resolveOrigin(skill, allSkills, orgName);
		const list = repoMap.get(origin);
		if (list) {
			list.push(skill);
		} else {
			repoMap.set(origin, [skill]);
		}
	}

	// Step 2: within each origin repo, group by skill name into rows
	const groups: OriginGroup[] = [];
	for (const [originKey, groupSkills] of repoMap) {
		const originOwner = originKey.split('/')[0];
		const [originOwnerPart, originRepoPart] = originKey.split('/');

		const nameMap = new Map<string, OriginSkillRow>();
		for (const skill of groupSkills) {
			const skillName = String(skill.frontmatter.name ?? skill.repo);
			let row = nameMap.get(skillName);
			if (!row) {
				row = { skillName, origin: null, derivatives: [] };
				nameMap.set(skillName, row);
			}
			// Is this skill in the origin repo itself?
			if (skill.owner === originOwnerPart && skill.repo === originRepoPart) {
				row.origin = skill;
			} else {
				row.derivatives.push(skill);
			}
		}

		const rows = [...nameMap.values()].sort((a, b) => a.skillName.localeCompare(b.skillName));

		groups.push({
			originKey,
			isExternal: originOwner !== orgName,
			totalSkills: groupSkills.length,
			uniqueSkills: rows.length,
			rows,
		});
	}

	// Sort: external origins first, then by key
	groups.sort((a, b) => {
		if (a.isExternal !== b.isExternal) return a.isExternal ? -1 : 1;
		return a.originKey.localeCompare(b.originKey);
	});

	return groups;
}
