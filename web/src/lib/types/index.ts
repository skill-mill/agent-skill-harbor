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
	collect_id?: string;
	collecting: {
		collected_at: string;
		duration_sec: number;
	};
	statistics: {
		org: CategoryStats;
		community: CategoryStats;
	};
}

export type LabelIntent = 'neutral' | 'info' | 'success' | 'warn' | 'danger';

export interface PluginSkillResult {
	label?: string;
	raw?: string;
	[key: string]: unknown;
}

export interface PluginOutputEntry {
	plugin_id: string;
	generated_at: string;
	collect_id?: string;
	summary?: string;
	label_intents?: Record<string, LabelIntent>;
	results?: Record<string, PluginSkillResult>;
}

export interface PluginFilterOption {
	plugin_id: string;
	labels: string[];
	short_label?: string;
	label_intents?: Record<string, LabelIntent>;
}

export interface PluginHistoryLabelCounts {
	org: number;
	community: number;
}

export interface PluginHistoryColumn {
	plugin_id: string;
	short_label?: string;
	label_abbreviations: Record<string, string>;
}

export interface PluginHistorySummary {
	[pluginId: string]: Record<string, PluginHistoryLabelCounts>;
}

export interface PluginLabelEntry {
	plugin_id: string;
	label: string;
	intent: LabelIntent;
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
	plugin_labels?: PluginLabelEntry[];
}
