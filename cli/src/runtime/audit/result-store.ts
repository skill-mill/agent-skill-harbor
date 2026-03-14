import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { AuditResultsYaml } from './types.js';

export function loadAuditResults(filePath: string): AuditResultsYaml {
	if (!existsSync(filePath)) {
		return { results: {} };
	}
	try {
		const raw = yamlLoad(readFileSync(filePath, 'utf-8')) as AuditResultsYaml | null;
		return raw?.results ? raw : { results: {} };
	} catch {
		return { results: {} };
	}
}

export function saveAuditResults(filePath: string, results: AuditResultsYaml): void {
	writeFileSync(filePath, yamlDump(results, { lineWidth: 120, noRefs: true }));
}
