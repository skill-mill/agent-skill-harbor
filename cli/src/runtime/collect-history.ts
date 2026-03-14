import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import type { AuditHistoryMeta, AuditHistoryReport } from './audit/types.js';

export interface CategoryStats {
	repos: number;
	repos_with_skills: number;
	skills: number;
	files: number;
}

export interface CollectHistoryEntry {
	id?: string;
	collecting: {
		collected_at: string;
		duration_sec: number;
	};
	statistics: {
		org: CategoryStats;
		community: CategoryStats;
	};
	auditing?: AuditHistoryMeta;
	report?: AuditHistoryReport;
}

function resolveHistoryPath(projectRoot: string): string {
	return join(projectRoot, 'data', 'collect-history.yaml');
}

export function loadCollectHistory(projectRoot: string): CollectHistoryEntry[] {
	const historyPath = resolveHistoryPath(projectRoot);
	if (!existsSync(historyPath)) return [];
	try {
		const raw = yamlLoad(readFileSync(historyPath, 'utf-8'));
		return Array.isArray(raw) ? (raw as CollectHistoryEntry[]) : [];
	} catch {
		return [];
	}
}

export function saveCollectHistoryEntries(projectRoot: string, entries: CollectHistoryEntry[]): void {
	writeFileSync(resolveHistoryPath(projectRoot), yamlDump(entries, { lineWidth: 120, noRefs: true }));
}

export function prependCollectHistoryEntry(projectRoot: string, entry: CollectHistoryEntry, limit: number): void {
	const history = loadCollectHistory(projectRoot);
	history.unshift(entry);
	const trimmed = limit > 0 ? history.slice(0, limit) : history;
	saveCollectHistoryEntries(projectRoot, trimmed);
}

export function createCollectHistoryEntry(input: Omit<CollectHistoryEntry, 'id'>): CollectHistoryEntry {
	return {
		id: randomUUID(),
		...input,
	};
}

export function updateCollectHistoryEntry(
	projectRoot: string,
	id: string,
	updater: (entry: CollectHistoryEntry) => CollectHistoryEntry,
): CollectHistoryEntry {
	const history = loadCollectHistory(projectRoot);
	const index = history.findIndex((entry) => entry.id === id);
	if (index < 0) {
		throw new Error(`Unknown history id: ${id}`);
	}

	const nextEntry = updater(history[index]);
	history[index] = nextEntry;
	saveCollectHistoryEntries(projectRoot, history);
	return nextEntry;
}
