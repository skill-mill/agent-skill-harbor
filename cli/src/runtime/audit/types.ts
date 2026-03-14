export type AuditResultValue = 'pass' | 'warn' | 'fail';

export interface AuditFinding {
	level?: 'warn' | 'fail';
	summary: string;
	file?: string;
	line?: number;
	category?: string;
	references?: string[];
}

export interface AuditEngineResult {
	result: AuditResultValue;
	summary?: string;
	findings?: AuditFinding[];
}

export interface AuditSkillResult {
	tree_sha: string | null;
	engines: Record<string, AuditEngineResult>;
}

export interface AuditResultsYaml {
	results: Record<string, AuditSkillResult>;
}

export interface AuditEngineConfig {
	id: string;
	command?: string[];
	timeout_sec?: number;
}

export interface AuditSettingsConfig {
	fail_on: AuditResultValue;
	exclude_community_repos: boolean;
	engines: AuditEngineConfig[];
}

export const DEFAULT_ENGINE_TIMEOUT_SEC = 30;
export const MAX_ENGINE_TIMEOUT_SEC = 300;

export interface ParsedCliArgs {
	force: boolean;
	engineIds?: string[];
}

export interface CatalogSkillEntry {
	repoKey: string;
	skillKey: string;
	skillPath: string;
	treeSha: string | null;
}
