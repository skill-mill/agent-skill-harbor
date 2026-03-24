import { existsSync, readFileSync } from 'node:fs';
import { load as yamlLoad } from 'js-yaml';

export function loadYamlArray<T>(filePath: string): T[] {
	if (!existsSync(filePath)) return [];
	try {
		const raw = yamlLoad(readFileSync(filePath, 'utf-8'));
		return Array.isArray(raw) ? (raw as T[]) : [];
	} catch {
		return [];
	}
}
