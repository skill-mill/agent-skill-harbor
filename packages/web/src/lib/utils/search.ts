import Fuse from 'fuse.js';
import type { FlatSkillEntry } from '$lib/types';

const fuseOptions: ConstructorParameters<typeof Fuse<FlatSkillEntry>>[1] = {
	keys: [
		{ name: 'frontmatter.name', weight: 3 },
		{ name: 'frontmatter.description', weight: 2 },
		{ name: 'frontmatter.metadata.author', weight: 1 },
		{ name: 'owner', weight: 1 },
		{ name: 'repo', weight: 1 },
	],
	threshold: 0.3,
	includeScore: true,
};

export function createSearchIndex(skills: FlatSkillEntry[]): Fuse<FlatSkillEntry> {
	return new Fuse(skills, fuseOptions);
}

export function searchSkills(fuse: Fuse<FlatSkillEntry>, query: string): FlatSkillEntry[] {
	if (!query.trim()) return [];
	return fuse.search(query).map((result) => result.item);
}
