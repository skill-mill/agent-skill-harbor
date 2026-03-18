import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface CatalogSkillEntry {
	tree_sha: string | null;
	updated_at?: string;
	registered_at?: string;
	resolved_from?: string;
}

export interface CatalogRepositoryEntry {
	visibility: string;
	repo_sha?: string;
	fork?: boolean;
	skills: Record<string, CatalogSkillEntry>;
}

export interface CatalogYaml {
	repositories: Record<string, CatalogRepositoryEntry>;
}

export function loadCatalog(projectRoot: string): CatalogYaml {
	const skillsYamlPath = join(projectRoot, 'data', 'skills.yaml');
	if (!existsSync(skillsYamlPath)) {
		return { repositories: {} };
	}
	try {
		const raw = yamlLoad(readFileSync(skillsYamlPath, 'utf-8')) as CatalogYaml;
		return raw?.repositories ? raw : { repositories: {} };
	} catch {
		return { repositories: {} };
	}
}

export function saveCatalog(catalog: CatalogYaml & { meta?: unknown }, projectRoot: string): void {
	const skillsYamlPath = join(projectRoot, 'data', 'skills.yaml');
	const { meta: _meta, ...rest } = catalog;
	writeFileSync(skillsYamlPath, yamlDump(sanitizeCatalogForSave(rest), { lineWidth: 120, noRefs: true }));
}

export function sanitizeCatalogForSave(catalog: CatalogYaml): CatalogYaml {
	return {
		repositories: Object.fromEntries(
			Object.entries(catalog.repositories).map(([repoKey, repoEntry]) => [
				repoKey,
				{
					visibility: repoEntry.visibility,
					...(repoEntry.repo_sha ? { repo_sha: repoEntry.repo_sha } : {}),
					...(repoEntry.fork ? { fork: true } : {}),
					skills: Object.fromEntries(
						Object.entries(repoEntry.skills).map(([skillPath, skillEntry]) => [
							skillPath,
							{
								tree_sha: skillEntry.tree_sha,
								...(skillEntry.updated_at ? { updated_at: skillEntry.updated_at } : {}),
								...(skillEntry.registered_at ? { registered_at: skillEntry.registered_at } : {}),
								...(skillEntry.resolved_from ? { resolved_from: skillEntry.resolved_from } : {}),
							},
						]),
					),
				},
			]),
		),
	};
}
