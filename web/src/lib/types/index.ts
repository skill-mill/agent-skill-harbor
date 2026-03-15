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
	resolved_from?: string;
	drift_status?: 'drifted' | 'in_sync' | 'unknown';
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

export interface CategoryStats {
	repos: number;
	repos_with_skills: number;
	skills: number;
	files: number;
}

export interface CollectionEntry {
	id?: string;
	collecting: {
		collected_at: string;
		duration_sec: number;
	};
	statistics: {
		org: CategoryStats;
		community: CategoryStats;
	};
	auditing?: {
		audited_at: string;
		duration_sec: number;
		engines: string[];
		skipped: boolean;
		skip_reason?: string;
	};
	report?: {
		org: {
			processed: { pass: number; info: number; warn: number; fail: number };
			skipped: { pass: number; info: number; warn: number; fail: number };
		};
		community: {
			processed: { pass: number; info: number; warn: number; fail: number };
			skipped: { pass: number; info: number; warn: number; fail: number };
		};
	};
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
	resolved_from?: string;
	drift_status?: 'drifted' | 'in_sync' | 'unknown';
}
