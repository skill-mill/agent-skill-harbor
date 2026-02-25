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
	files: string[];
}

export interface RepositoryEntry {
	visibility: Visibility;
	repo_sha?: string;
	skills: Record<string, CatalogSkillEntry>;
}

export interface Catalog {
	repositories: Record<string, RepositoryEntry>;
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

export interface FlatCatalog {
	generated_at: string;
	org_name: string | null;
	fresh_period_days: number;
	skills: FlatSkillEntry[];
}
