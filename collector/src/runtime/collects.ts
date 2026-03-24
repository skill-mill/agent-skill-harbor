import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';

export interface CategoryStats {
	repos: number;
	repos_with_skills: number;
	skills: number;
	files: number;
}

export interface CollectEntry {
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

function resolveCollectsPath(projectRoot: string): string {
	return join(projectRoot, 'data', 'collects.yaml');
}

export function loadCollects(projectRoot: string): CollectEntry[] {
	const collectsPath = resolveCollectsPath(projectRoot);
	if (!existsSync(collectsPath)) return [];
	try {
		const raw = yamlLoad(readFileSync(collectsPath, 'utf-8'));
		return Array.isArray(raw) ? (raw as CollectEntry[]) : [];
	} catch {
		return [];
	}
}

export function saveCollects(projectRoot: string, entries: CollectEntry[]): void {
	writeFileSync(resolveCollectsPath(projectRoot), yamlDump(entries, { lineWidth: 120, noRefs: true }));
}

export function prependCollectEntry(projectRoot: string, entry: CollectEntry, limit: number): void {
	const collects = loadCollects(projectRoot);
	collects.unshift(entry);
	const trimmed = limit > 0 ? collects.slice(0, limit) : collects;
	saveCollects(projectRoot, trimmed);
}

export function createCollectEntry(input: Omit<CollectEntry, 'collect_id'>): CollectEntry {
	return {
		collect_id: randomUUID(),
		...input,
	};
}
