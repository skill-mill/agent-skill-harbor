export type LabelIntent = 'neutral' | 'info' | 'success' | 'warn' | 'danger';

export interface PostCollectSkillResult {
	label?: string;
	raw?: string;
	[key: string]: unknown;
}

export interface PostCollectPluginResult {
	persist?: boolean;
	summary?: string;
	label_intents?: Record<string, LabelIntent>;
	sub_artifacts?: string[];
	results?: Record<string, PostCollectSkillResult>;
}

export interface PostCollectCatalogSkillEntry {
	tree_sha: string | null;
	updated_at?: string;
	registered_at?: string;
	resolved_from?: string;
}

export interface PostCollectCatalogRepositoryEntry {
	visibility: string;
	repo_sha?: string;
	fork?: boolean;
	skills: Record<string, PostCollectCatalogSkillEntry>;
}

export interface PostCollectCatalog {
	repositories: Record<string, PostCollectCatalogRepositoryEntry>;
}

export interface PostCollectPluginContext {
	schema_version: number;
	plugin_id: string;
	project_root: string;
	collect_id: string | null;
	org_name?: string;
	plugin_config?: Record<string, unknown>;
	paths: {
		data_dir: string;
		catalog_yaml: string;
		skills_dir: string;
		collects_yaml: string;
	};
	catalog: PostCollectCatalog;
}

export interface PostCollectPluginModule {
	run(context: PostCollectPluginContext): Promise<PostCollectPluginResult> | PostCollectPluginResult;
}

export interface BuiltinPostCollectPlugin extends PostCollectPluginModule {
	id: string;
}

export interface PostCollectPluginConfig {
	id: string;
	short_label?: string;
	config?: Record<string, unknown>;
}

export interface PostCollectSettings {
	plugins: PostCollectPluginConfig[];
}
