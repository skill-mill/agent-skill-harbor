export type AuditResultValue = 'pass' | 'info' | 'warn' | 'fail';

export interface AuditFinding {
	level?: 'info' | 'warn' | 'fail';
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

export interface AuditResultCounts {
	pass: number;
	info: number;
	warn: number;
	fail: number;
}

export interface AuditHistoryReportBucket {
	processed: AuditResultCounts;
	skipped: AuditResultCounts;
}

export interface AuditHistoryReport {
	org: AuditHistoryReportBucket;
	community: AuditHistoryReportBucket;
}

export interface AuditHistoryMeta {
	audited_at: string;
	duration_sec: number;
	engines: string[];
	skipped: boolean;
	skip_reason?: string;
}

export interface AuditRunSummary {
	overall: AuditResultValue;
	total: number;
	skipped: number;
	processed: number;
	duration_ms: number;
	average_duration_ms: number;
	report?: AuditHistoryReport;
	auditing: AuditHistoryMeta;
}

export interface AuditEngineConfig {
	id: string;
	command?: string[];
	timeout_sec?: number;
}

export interface AuditSettingsConfig {
	exclude_community_repos: boolean;
	engines: AuditEngineConfig[];
}

export const DEFAULT_ENGINE_TIMEOUT_SEC = 30;
export const MAX_ENGINE_TIMEOUT_SEC = 300;

export interface ParsedCliArgs {
	force: boolean;
	engineIds?: string[];
	historyId?: string;
}

export interface CatalogSkillEntry {
	repoKey: string;
	skillKey: string;
	skillPath: string;
	treeSha: string | null;
}
