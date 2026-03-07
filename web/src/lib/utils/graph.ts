import Graph from 'graphology';
import type { FlatSkillEntry } from '$lib/types';

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

const COLORS = {
	skill: '#3b82f6', // blue-500
	repo: '#10b981', // emerald-500
	edgeDerivedFrom: '#f59e0b', // amber-500
	edgeLivesIn: '#cbd5e1' // slate-300
};

const COLORS_DARK = {
	skill: '#60a5fa', // blue-400
	repo: '#34d399', // emerald-400
	edgeDerivedFrom: '#fbbf24', // amber-400
	edgeLivesIn: '#475569' // slate-600
};

export function getColors(dark: boolean) {
	return dark ? COLORS_DARK : COLORS;
}

function parseFrom(from: unknown): { owner: string; repo: string; sha: string } | null {
	if (typeof from !== 'string') return null;
	const match = from.match(/^([^/]+)\/([^@]+)@(.+)$/);
	if (!match) return null;
	return { owner: match[1], repo: match[2], sha: match[3] };
}

/** Simple deterministic hash → [0, 1) float from a string */
function hashToFloat(s: string, seed: number): number {
	let h = seed | 0;
	for (let i = 0; i < s.length; i++) {
		h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
	}
	return ((h >>> 0) % 10000) / 10000;
}

function repoNodeId(owner: string, repo: string): string {
	return `repo:${owner}/${repo}`;
}

function skillNodeId(key: string): string {
	return `skill:${key}`;
}

export function buildSkillGraph(skills: FlatSkillEntry[], dark = false): Graph {
	const graph = new Graph({ multi: false, type: 'mixed' });
	const colors = getColors(dark);
	const repoSkillCounts = new Map<string, number>();

	// Pre-compute repo sizes (number of connected skills)
	for (const skill of skills) {
		const catalogRepo = repoNodeId(skill.owner, skill.repo);
		repoSkillCounts.set(catalogRepo, (repoSkillCounts.get(catalogRepo) ?? 0) + 1);

		const from = parseFrom(skill.frontmatter._from);
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
		graph.addNode(id, {
			nodeType: 'repo',
			label: `${parts[0]}/${parts[1]}`,
			color: colors.repo,
			size: Math.max(8, Math.min(20, 6 + count * 3)),
			owner: parts[0],
			repo: parts[1],
			url: `https://github.com/${parts[0]}/${parts[1]}`,
			x: hashToFloat(id, 1) * 100,
			y: hashToFloat(id, 2) * 100
		});
	}

	// Add skill nodes and edges
	for (const skill of skills) {
		const sId = skillNodeId(skill.key);
		const name = String(skill.frontmatter.name ?? skill.repo);

		graph.addNode(sId, {
			nodeType: 'skill',
			label: name,
			color: colors.skill,
			size: 5,
			skillKey: skill.key,
			description: String(skill.frontmatter.description ?? ''),
			owner: skill.owner,
			repo: skill.repo,
			usagePolicy: skill.usage_policy,
			x: hashToFloat(sId, 1) * 100,
			y: hashToFloat(sId, 2) * 100
		});

		// lives_in edge: skill ↔ catalog repo (undirected)
		const catalogRepo = repoNodeId(skill.owner, skill.repo);
		if (graph.hasNode(catalogRepo)) {
			graph.addUndirectedEdge(sId, catalogRepo, {
				edgeType: 'lives_in',
				color: colors.edgeLivesIn,
				size: 1
			});
		}

		// derived_from edge: skill → source repo (directed arrow)
		const from = parseFrom(skill.frontmatter._from);
		if (from) {
			const sourceRepo = repoNodeId(from.owner, from.repo);
			if (sourceRepo !== catalogRepo && graph.hasNode(sourceRepo)) {
				graph.addDirectedEdge(sId, sourceRepo, {
					edgeType: 'derived_from',
					type: 'arrow',
					color: colors.edgeDerivedFrom,
					size: 2
				});
			}
		}
	}

	return graph;
}