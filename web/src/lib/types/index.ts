export type UsagePolicy = 'recommended' | 'discouraged' | 'prohibited' | 'none';
export type Visibility = 'public' | 'private' | 'internal';

export interface SkillMetadata {
	usage_policy: UsagePolicy;
	note?: string;
}

export interface CatalogSkillEntry {
	tree_sha: string | null;
	updated_at?: string;
	registered_at?: string;
	frontmatter: Record<string, unknown>;
}

export interface RepositoryEntry {
	visibility: Visibility;
	repo_sha?: string;
	skills: Record<string, CatalogSkillEntry>;
}

export interface Catalog {
	repositories: Record<string, RepositoryEntry>;
}

export interface RepoInfo {
	repoKey: string;
	platform: string;
	owner: string;
	repo: string;
	visibility: Visibility;
	isOrgOwned: boolean;
	is_fork: boolean;
	repo_sha?: string;
	skillCount: number;
}

export interface CollectionEntry {
	collected_at: string;
	duration_sec: number;
	repos: { total: number; collected: number; unchanged: number; from: number; extra?: number };
	skills: { total: number; collected: number; unchanged: number };
	files: { collected: number };
}

export interface FlatSkillEntry {
	key: string;
	repoKey: string;
	skillPath: string;
	platform: string;
	owner: string;
	repo: string;
	visibility: Visibility;
	isOrgOwned: boolean;
	frontmatter: Record<string, unknown>;
	files: string[];
	excerpt: string;
	usage_policy: UsagePolicy;
	note?: string;
	updated_at?: string;
	registered_at?: string;
	repo_sha?: string;
	tree_sha?: string | null;
	is_fork?: boolean;
}
