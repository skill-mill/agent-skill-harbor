import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import { DEFAULT_ENGINE_TIMEOUT_SEC, MAX_ENGINE_TIMEOUT_SEC } from './types.js';
import type {
	AuditEngineConfig,
	AuditResultValue,
	AuditSettingsConfig,
	CatalogSkillEntry,
	ParsedCliArgs,
} from './types.js';

interface RepositoryEntry {
	visibility: string;
	repo_sha?: string;
	fork?: boolean;
	skills: Record<string, { tree_sha: string | null }>;
}

interface CatalogYaml {
	repositories: Record<string, RepositoryEntry>;
}

type RawSettings = {
	audit?: {
		exclude_community_repos?: boolean;
		engines?: AuditEngineConfig[];
	};
};

const DEFAULT_AUDIT_SETTINGS: AuditSettingsConfig = {
	exclude_community_repos: true,
	engines: [{ id: 'builtin.static' }],
};

export function parseCliArgs(argv: string[]): ParsedCliArgs {
	let force = false;
	let engineIds: string[] | undefined;
	let historyId: string | undefined;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--force') {
			force = true;
			continue;
		}
		if (arg === '--engines') {
			const value = argv[i + 1];
			if (!value) throw new Error('--engines requires a comma-separated value.');
			engineIds = value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean);
			if (engineIds.length === 0) throw new Error('--engines requires at least one engine id.');
			i++;
			continue;
		}
		if (arg === '--history-id') {
			const value = argv[i + 1];
			if (!value) throw new Error('--history-id requires a value.');
			historyId = value.trim();
			if (!historyId) throw new Error('--history-id requires a non-empty value.');
			i++;
			continue;
		}
		throw new Error(`Unknown option: ${arg}`);
	}

	return { force, engineIds, historyId };
}

export function loadAuditSettings(projectRoot: string): AuditSettingsConfig {
	const settingsPath = join(projectRoot, 'config', 'harbor.yaml');
	if (!existsSync(settingsPath)) return DEFAULT_AUDIT_SETTINGS;

	try {
		const raw = yamlLoad(readFileSync(settingsPath, 'utf-8')) as RawSettings | null;
		const audit = raw?.audit;
		return {
			exclude_community_repos: audit?.exclude_community_repos ?? DEFAULT_AUDIT_SETTINGS.exclude_community_repos,
			engines: audit?.engines ?? DEFAULT_AUDIT_SETTINGS.engines,
		};
	} catch {
		return DEFAULT_AUDIT_SETTINGS;
	}
}

export function resolveAuditEngines(settings: AuditSettingsConfig, overrideIds?: string[]): AuditEngineConfig[] {
	validateAuditEngines(settings.engines);

	const configuredById = new Map(settings.engines.map((engine) => [engine.id, engine]));
	const selected = overrideIds ?? settings.engines.map((engine) => engine.id);
	const resolved: AuditEngineConfig[] = [];

	for (const id of selected) {
		if (id === 'builtin.static') {
			resolved.push({ id: 'builtin.static' });
			continue;
		}

		const engine = configuredById.get(id);
		if (!engine) {
			throw new Error(`Unknown audit engine: ${id}`);
		}
		resolved.push({
			...engine,
			timeout_sec: engine.timeout_sec ?? DEFAULT_ENGINE_TIMEOUT_SEC,
		});
	}

	return resolved;
}

export function validateAuditEngines(engines: AuditEngineConfig[]): void {
	const seen = new Set<string>();
	for (const engine of engines) {
		if (!engine.id) throw new Error('Each audit engine must include a non-empty id.');
		if (seen.has(engine.id)) throw new Error(`Duplicate audit engine id: ${engine.id}`);
		seen.add(engine.id);

		if (engine.id === 'builtin.static') {
			if (engine.command && engine.command.length > 0) {
				throw new Error('Built-in audit engine "builtin.static" must not define a command.');
			}
			continue;
		}

		if (!engine.command || engine.command.length === 0) {
			throw new Error(`Audit engine "${engine.id}" requires a command.`);
		}
		if (engine.timeout_sec != null) {
			if (!Number.isInteger(engine.timeout_sec) || engine.timeout_sec < 1) {
				throw new Error(`Audit engine "${engine.id}" timeout_sec must be an integer >= 1.`);
			}
			if (engine.timeout_sec > MAX_ENGINE_TIMEOUT_SEC) {
				throw new Error(`Audit engine "${engine.id}" timeout_sec must be <= ${MAX_ENGINE_TIMEOUT_SEC} seconds.`);
			}
		}
	}
}

export function loadCatalogSkills(projectRoot: string): CatalogSkillEntry[] {
	const catalogPath = join(projectRoot, 'data', 'skills.yaml');
	if (!existsSync(catalogPath)) return [];
	const raw = yamlLoad(readFileSync(catalogPath, 'utf-8')) as CatalogYaml | null;
	const repositories = raw?.repositories ?? {};
	const skills: CatalogSkillEntry[] = [];

	for (const [repoKey, repoEntry] of Object.entries(repositories)) {
		for (const [skillPath, skillEntry] of Object.entries(repoEntry.skills)) {
			skills.push({
				repoKey,
				skillKey: `${repoKey}/${skillPath}`,
				skillPath,
				treeSha: skillEntry.tree_sha ?? null,
			});
		}
	}

	return skills.sort((a, b) => a.skillKey.localeCompare(b.skillKey));
}

export function detectOrgName(projectRoot: string): string | null {
	if (process.env.GH_ORG) return process.env.GH_ORG;
	try {
		const remoteUrl = execSync('git remote get-url origin', {
			encoding: 'utf-8',
			cwd: projectRoot,
		}).trim();
		const sshMatch = remoteUrl.match(/^git@[^:]+:([^/]+)\/([^/.]+)/);
		if (sshMatch) return sshMatch[1];
		const httpsMatch = remoteUrl.match(/^https?:\/\/[^/]+\/([^/]+)\/([^/.]+)/);
		if (httpsMatch) return httpsMatch[1];
	} catch {
		// ignore git detection failures
	}
	return null;
}

export function filterAuditSkills(
	skills: CatalogSkillEntry[],
	excludeCommunityRepos: boolean,
	orgName: string | null,
): CatalogSkillEntry[] {
	if (!excludeCommunityRepos) return skills;
	if (!orgName) {
		throw new Error('Unable to determine GH_ORG for audit.exclude_community_repos=true.');
	}
	return skills.filter((skill) => skill.repoKey.split('/')[1] === orgName);
}

export function compareAuditResults(a: AuditResultValue, b: AuditResultValue): number {
	const rank: Record<AuditResultValue, number> = { pass: 0, info: 1, warn: 2, fail: 3 };
	return rank[a] - rank[b];
}
