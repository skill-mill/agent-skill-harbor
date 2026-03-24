import type { FlatSkillEntry } from '$lib/types';
import { getResolvedFrom, parseResolvedFrom } from '$lib/utils/resolved-from';

export interface SkillNodeAttrs {
	nodeType: 'skill';
	label: string;
	color: string;
	size: number;
	skillKey: string;
	description: string;
	owner: string;
	repo: string;
	usagePolicy: string;
}

export interface RepoNodeAttrs {
	nodeType: 'repo';
	label: string;
	color: string;
	size: number;
	owner: string;
	repo: string;
	url: string;
}

export type GraphNodeAttrs = SkillNodeAttrs | RepoNodeAttrs;

export type GraphNode = GraphNodeAttrs & { id: string };

export interface GraphLink {
	source: string;
	target: string;
	edgeType: 'lives_in' | 'derived_from';
	color: string;
}

export interface GraphData {
	nodes: GraphNode[];
	links: GraphLink[];
}

const COLORS = {
	skill: '#6366f1', // indigo-500
	repo: '#0d9488', // teal-600
	edgeDerivedFrom: '#d97706', // amber-600
	edgeLivesIn: '#cbd5e1', // slate-300
};

const COLORS_DARK = {
	skill: '#a5b4fc', // indigo-300
	repo: '#5eead4', // teal-300
	edgeDerivedFrom: '#fbbf24', // amber-400
	edgeLivesIn: '#475569', // slate-600
};

export function getColors(dark: boolean) {
	return dark ? COLORS_DARK : COLORS;
}

function repoNodeId(owner: string, repo: string): string {
	return `repo:${owner}/${repo}`;
}

function skillNodeId(key: string): string {
	return `skill:${key}`;
}

export function buildGraphData(skills: FlatSkillEntry[], dark = false): GraphData {
	const colors = getColors(dark);
	const nodes: GraphNode[] = [];
	const links: GraphLink[] = [];
	const repoSkillCounts = new Map<string, number>();
	const repoNodeIds = new Set<string>();

	// Pre-compute repo sizes
	for (const skill of skills) {
		const catalogRepo = repoNodeId(skill.owner, skill.repo);
		repoSkillCounts.set(catalogRepo, (repoSkillCounts.get(catalogRepo) ?? 0) + 1);

		const resolvedFrom = getResolvedFrom(skill);
		const from = resolvedFrom ? parseResolvedFrom(resolvedFrom) : null;
		if (from) {
			const sourceRepo = repoNodeId(from.owner, from.repo);
			if (sourceRepo !== catalogRepo) {
				repoSkillCounts.set(sourceRepo, (repoSkillCounts.get(sourceRepo) ?? 0) + 1);
			}
		}
	}

	// Add repo nodes
	for (const [id, count] of repoSkillCounts) {
		const parts = id.replace('repo:', '').split('/');
		repoNodeIds.add(id);
		nodes.push({
			id,
			nodeType: 'repo',
			label: `${parts[0]}/${parts[1]}`,
			color: colors.repo,
			size: Math.max(2, Math.min(6, 1.5 + count * 0.8)),
			owner: parts[0],
			repo: parts[1],
			url: `https://github.com/${parts[0]}/${parts[1]}`,
		} as GraphNode);
	}

	// Add skill nodes and links
	for (const skill of skills) {
		const sId = skillNodeId(skill.key);
		const name = String(skill.frontmatter.name ?? skill.repo);

		nodes.push({
			id: sId,
			nodeType: 'skill',
			label: name,
			color: colors.skill,
			size: 1.5,
			skillKey: skill.key,
			description: String(skill.frontmatter.description ?? ''),
			owner: skill.owner,
			repo: skill.repo,
			usagePolicy: skill.usage_policy,
		} as GraphNode);

		// lives_in link
		const catalogRepo = repoNodeId(skill.owner, skill.repo);
		if (repoNodeIds.has(catalogRepo)) {
			links.push({
				source: sId,
				target: catalogRepo,
				edgeType: 'lives_in',
				color: colors.edgeLivesIn,
			});
		}

		// derived_from link
		const resolvedFrom = getResolvedFrom(skill);
		const from = resolvedFrom ? parseResolvedFrom(resolvedFrom) : null;
		if (from) {
			const sourceRepo = repoNodeId(from.owner, from.repo);
			if (sourceRepo !== catalogRepo && repoNodeIds.has(sourceRepo)) {
				links.push({
					source: sId,
					target: sourceRepo,
					edgeType: 'derived_from',
					color: colors.edgeDerivedFrom,
				});
			}
		}
	}

	return { nodes, links };
}
