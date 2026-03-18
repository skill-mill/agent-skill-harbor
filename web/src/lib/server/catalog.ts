import matter from 'gray-matter';
import { load as yamlLoad } from 'js-yaml';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type {
	CollectionEntry,
	FlatSkillEntry,
	LabelIntent,
	PluginFilterOption,
	PluginHistoryColumn,
	PluginHistorySummary,
	PluginLabelEntry,
	PluginOutputEntry,
	RepoInfo,
	Visibility,
} from '$lib/types';
import { governancePolicySchema, type GovernanceConfig } from '$lib/schemas/governance';
import { settingsSchema, type SettingsConfig } from '$lib/schemas/settings';
import { normalizeResolvedFromFrontmatter } from '$lib/utils/resolved-from';

declare const __PROJECT_ROOT__: string;

type UsagePolicy = 'recommended' | 'discouraged' | 'prohibited' | 'none';

interface GovernanceEntry {
	usage_policy: UsagePolicy;
	note?: string;
}

interface SkillEntry {
	tree_sha: string | null;
	updated_at?: string;
	registered_at?: string;
	resolved_from?: string;
}

interface RepositoryEntry {
	visibility: string;
	repo_sha?: string;
	fork?: boolean;
	skills: Record<string, SkillEntry>;
}

interface CatalogYaml {
	repositories: Record<string, RepositoryEntry>;
}

interface CatalogResult {
	orgName: string | null;
	repoFullName: string | null;
	freshPeriodDays: number;
	skills: FlatSkillEntry[];
	repos: RepoInfo[];
	bodyMap: Map<string, string>;
}

function buildPluginLabelMap(outputs: PluginOutputEntry[]): Map<string, PluginLabelEntry[]> {
	const map = new Map<string, PluginLabelEntry[]>();
	for (const output of outputs) {
		const labelIntents = output.label_intents ?? {};
		for (const [skillKey, result] of Object.entries(output.results ?? {})) {
			if (!result || typeof result !== 'object' || typeof result.label !== 'string' || result.label.length === 0) {
				continue;
			}
			const entries = map.get(skillKey) ?? [];
			entries.push({
				plugin_id: output.plugin_id,
				label: result.label,
				intent: labelIntents[result.label] ?? 'neutral',
			});
			map.set(skillKey, entries);
		}
	}
	for (const [skillKey, entries] of map.entries()) {
		entries.sort((a, b) =>
			a.plugin_id === b.plugin_id ? a.label.localeCompare(b.label) : a.plugin_id.localeCompare(b.plugin_id),
		);
		map.set(skillKey, entries);
	}
	return map;
}

// Module-level cache: parsed once per build
let cached: CatalogResult | null = null;

const PROJECT_ROOT = __PROJECT_ROOT__;
const DATA_DIR = join(PROJECT_ROOT, 'data');
const SKILLS_DIR = join(DATA_DIR, 'skills');
const SKILLS_YAML_PATH = join(DATA_DIR, 'skills.yaml');
const COLLECTS_YAML_PATH = join(DATA_DIR, 'collects.yaml');
const PLUGINS_DIR = join(DATA_DIR, 'plugins');
const CONFIG_DIR = join(PROJECT_ROOT, 'config');
const GOVERNANCE_PATH = join(CONFIG_DIR, 'governance.yaml');
const HARBOR_PATH = join(CONFIG_DIR, 'harbor.yaml');

function detectOrgRepo(): { org: string | null; repo: string | null } {
	let org: string | null = env.GH_ORG || null;
	let repo: string | null = env.GH_REPO || null;
	if (org && repo) return { org, repo };
	try {
		const remoteUrl = execSync('git remote get-url origin', {
			encoding: 'utf-8',
			cwd: PROJECT_ROOT,
		}).trim();
		const sshMatch = remoteUrl.match(/^git@[^:]+:([^/]+)\/([^/.]+)/);
		if (sshMatch) {
			org = org ?? sshMatch[1];
			repo = repo ?? sshMatch[2];
			return { org, repo };
		}
		const httpsMatch = remoteUrl.match(/^https?:\/\/[^/]+\/([^/]+)\/([^/.]+)/);
		if (httpsMatch) {
			org = org ?? httpsMatch[1];
			repo = repo ?? httpsMatch[2];
			return { org, repo };
		}
	} catch {
		// git command failed
	}
	return { org, repo };
}

function loadGovernanceRaw(): GovernanceConfig {
	if (!existsSync(GOVERNANCE_PATH)) return { policies: {} };
	const raw = yamlLoad(readFileSync(GOVERNANCE_PATH, 'utf-8'));
	const obj = (raw && typeof raw === 'object' && 'policies' in raw ? raw.policies : {}) as Record<string, unknown>;
	const policies: GovernanceConfig['policies'] = {};
	for (const [key, value] of Object.entries(obj)) {
		const result = governancePolicySchema.safeParse(value);
		if (result.success) {
			policies[key] = result.data;
		}
	}
	return { policies };
}

function loadGovernance(): Record<string, GovernanceEntry> {
	return loadGovernanceRaw().policies;
}

function loadSettingsRaw(): SettingsConfig {
	if (!existsSync(HARBOR_PATH)) return settingsSchema.parse({});
	try {
		const raw = yamlLoad(readFileSync(HARBOR_PATH, 'utf-8'));
		return settingsSchema.parse(raw ?? {});
	} catch {
		return settingsSchema.parse({});
	}
}

function loadAdmin(): SettingsConfig {
	return loadSettingsRaw();
}

function loadCatalogYaml(): CatalogYaml {
	if (!existsSync(SKILLS_YAML_PATH)) return { repositories: {} };
	try {
		const raw = yamlLoad(readFileSync(SKILLS_YAML_PATH, 'utf-8')) as CatalogYaml;
		return raw?.repositories ? raw : { repositories: {} };
	} catch {
		return { repositories: {} };
	}
}

interface SkillFsEntry {
	frontmatter: Record<string, unknown>;
	body: string;
	files: string[];
}

function collectFilesRecursive(baseDir: string, currentDir: string, results: string[]): void {
	for (const entry of readdirSync(currentDir)) {
		const fullPath = join(currentDir, entry);
		const stat = statSync(fullPath);
		if (stat.isFile()) {
			results.push(relative(baseDir, fullPath));
		} else if (stat.isDirectory()) {
			collectFilesRecursive(baseDir, fullPath, results);
		}
	}
}

function walkSkillDirs(baseDir: string, currentDir: string, results: Map<string, SkillFsEntry>): void {
	for (const entry of readdirSync(currentDir)) {
		if (entry.startsWith('_')) continue;
		const fullPath = join(currentDir, entry);
		const stat = statSync(fullPath);

		if (stat.isFile() && entry === 'SKILL.md') {
			const relDir = relative(baseDir, currentDir);
			const skillPath = relDir ? `${relDir}/SKILL.md` : 'SKILL.md';
			try {
				const content = readFileSync(fullPath, 'utf-8');
				const parsed = matter(content);
				const frontmatter: Record<string, unknown> = { ...parsed.data };
				delete frontmatter._excerpt;

				// Collect all files in the skill directory
				const files: string[] = [];
				if (relDir) {
					collectFilesRecursive(baseDir, currentDir, files);
				} else {
					files.push('SKILL.md');
				}
				files.sort();

				results.set(skillPath, { frontmatter, body: parsed.content.trim(), files });
			} catch {
				// skip unparseable SKILL.md
			}
		} else if (stat.isDirectory()) {
			walkSkillDirs(baseDir, fullPath, results);
		}
	}
}

function buildCatalogData(): CatalogResult {
	const { org: orgName, repo: repoName } = detectOrgRepo();
	const repoFullName = orgName && repoName ? `${orgName}/${repoName}` : orgName;
	const admin = loadAdmin();
	const freshPeriodDays = admin.catalog?.skill?.fresh_period_days ?? 0;
	const governance = loadGovernance();
	const catalogYaml = loadCatalogYaml();
	const pluginLabelMap = buildPluginLabelMap(loadLatestPluginOutputs());

	const skills: FlatSkillEntry[] = [];
	const repos: RepoInfo[] = [];
	const bodyMap = new Map<string, string>();

	const platformDir = join(SKILLS_DIR, 'github.com');
	if (!existsSync(platformDir)) {
		return { orgName, repoFullName, freshPeriodDays, skills, repos, bodyMap };
	}

	// Scan SKILL.md files per repo
	for (const [repoKey, repoEntry] of Object.entries(catalogYaml.repositories)) {
		const parts = repoKey.split('/');
		const platform = parts[0];
		const owner = parts[1];
		const repo = parts[2];
		const repoDir = join(SKILLS_DIR, repoKey);

		repos.push({
			repoKey,
			platform,
			owner,
			repo,
			visibility: repoEntry.visibility as Visibility,
			isOrgOwned: orgName != null && owner === orgName,
			is_fork: !!repoEntry.fork,
			...(repoEntry.repo_sha ? { repo_sha: repoEntry.repo_sha } : {}),
			skillCount: Object.keys(repoEntry.skills).length,
		});

		if (!existsSync(repoDir)) continue;

		// Read all SKILL.md and associated files from filesystem
		const skillMdMap = new Map<string, SkillFsEntry>();
		walkSkillDirs(repoDir, repoDir, skillMdMap);

		for (const [skillPath, skillData] of Object.entries(repoEntry.skills)) {
			const key = `${repoKey}/${skillPath}`;
			const gov = governance[key];

			const fromFs = skillMdMap.get(skillPath);
			if (!fromFs) continue;
			const frontmatter = fromFs.frontmatter;
			const body = fromFs.body;
			const resolvedFrom = skillData.resolved_from ?? normalizeResolvedFromFrontmatter(frontmatter._from);

			if (body) {
				bodyMap.set(key, body);
			}

			const entry: FlatSkillEntry = {
				key,
				repoKey,
				skillPath,
				platform,
				owner,
				repo,
				visibility: repoEntry.visibility as Visibility,
				isOrgOwned: orgName != null && owner === orgName,
				frontmatter,
				files: fromFs.files,
				excerpt: body.slice(0, 300),
				usage_policy: gov?.usage_policy ?? 'none',
				...(gov?.note ? { note: gov.note } : {}),
				...(skillData.updated_at ? { updated_at: skillData.updated_at } : {}),
				...(skillData.registered_at ? { registered_at: skillData.registered_at } : {}),
				...(repoEntry.repo_sha ? { repo_sha: repoEntry.repo_sha } : {}),
				tree_sha: skillData.tree_sha ?? null,
				...(repoEntry.fork ? { is_fork: true } : {}),
				...(resolvedFrom ? { resolved_from: resolvedFrom } : {}),
				...(pluginLabelMap.get(key)?.length ? { plugin_labels: pluginLabelMap.get(key) } : {}),
			};

			skills.push(entry);
		}
	}

	const now = Date.now();
	const freshMs = freshPeriodDays * 86_400_000;
	const isNew = (s: FlatSkillEntry) =>
		freshPeriodDays > 0 && !!s.registered_at && now - new Date(s.registered_at).getTime() < freshMs;

	skills.sort((a, b) => {
		const aNew = isNew(a);
		const bNew = isNew(b);
		if (aNew !== bNew) return aNew ? -1 : 1;
		const nameA = String(a.frontmatter.name ?? a.key).toLowerCase();
		const nameB = String(b.frontmatter.name ?? b.key).toLowerCase();
		return nameA.localeCompare(nameB);
	});

	repos.sort((a, b) => `${a.owner}/${a.repo}`.localeCompare(`${b.owner}/${b.repo}`));

	return { orgName, repoFullName, freshPeriodDays, skills, repos, bodyMap };
}

export function loadCatalog(): CatalogResult {
	if (dev || !cached) {
		cached = buildCatalogData();
	}
	return cached;
}

export function getSkillBody(key: string): string {
	const { bodyMap } = loadCatalog();
	return bodyMap.get(key) ?? '';
}

export function loadSettingsConfig(): SettingsConfig {
	return loadSettingsRaw();
}

export function loadSettingsConfigRaw(): string | null {
	if (!existsSync(HARBOR_PATH)) return null;
	try {
		return readFileSync(HARBOR_PATH, 'utf-8');
	} catch {
		return null;
	}
}

export function loadGovernanceConfigRaw(): string | null {
	if (!existsSync(GOVERNANCE_PATH)) return null;
	try {
		return readFileSync(GOVERNANCE_PATH, 'utf-8');
	} catch {
		return null;
	}
}

export function loadGovernanceConfig(): GovernanceConfig {
	return loadGovernanceRaw();
}

let cachedHistory: CollectionEntry[] | null = null;

export function loadCollectHistory(): CollectionEntry[] {
	if (!dev && cachedHistory) return cachedHistory;
	if (!existsSync(COLLECTS_YAML_PATH)) {
		cachedHistory = [];
		return cachedHistory;
	}
	try {
		const raw = yamlLoad(readFileSync(COLLECTS_YAML_PATH, 'utf-8'));
		cachedHistory = Array.isArray(raw) ? raw : [];
	} catch {
		cachedHistory = [];
	}
	return cachedHistory;
}

let cachedPluginOutputs: PluginOutputEntry[] | null = null;
let cachedLatestPluginOutputs: PluginOutputEntry[] | null = null;
let cachedPluginHistoryColumns: PluginHistoryColumn[] | null = null;
let cachedPluginHistorySummaries: Record<string, PluginHistorySummary> | null = null;

export function loadPluginOutputHistory(): PluginOutputEntry[] {
	if (!dev && cachedPluginOutputs) return cachedPluginOutputs;
	if (!existsSync(PLUGINS_DIR)) {
		cachedPluginOutputs = [];
		return cachedPluginOutputs;
	}
	const outputs: PluginOutputEntry[] = [];
	for (const entry of readdirSync(PLUGINS_DIR)) {
		if (!entry.endsWith('.yaml') && !entry.endsWith('.yml')) continue;
		const pluginId = entry.replace(/\.(yaml|yml)$/i, '');
		try {
			const raw = yamlLoad(readFileSync(join(PLUGINS_DIR, entry), 'utf-8'));
			if (Array.isArray(raw)) {
				for (const item of raw) {
					if (!item || typeof item !== 'object') continue;
					outputs.push({ plugin_id: pluginId, ...(item as Omit<PluginOutputEntry, 'plugin_id'>) });
				}
			}
		} catch {
			// ignore invalid plugin output
		}
	}
	outputs.sort((a, b) =>
		a.plugin_id === b.plugin_id
			? b.generated_at.localeCompare(a.generated_at)
			: a.plugin_id.localeCompare(b.plugin_id),
	);
	cachedPluginOutputs = outputs;
	return cachedPluginOutputs;
}

function getLatestCollectId(): string | null {
	return loadCollectHistory()[0]?.collect_id ?? null;
}

export function loadLatestPluginOutputs(): PluginOutputEntry[] {
	if (!dev && cachedLatestPluginOutputs) return cachedLatestPluginOutputs;
	const latestCollectId = getLatestCollectId();
	if (!latestCollectId) {
		cachedLatestPluginOutputs = [];
		return cachedLatestPluginOutputs;
	}
	const latestByPlugin = new Map<string, PluginOutputEntry>();
	for (const output of loadPluginOutputHistory()) {
		if (output.collect_id !== latestCollectId) continue;
		if (!latestByPlugin.has(output.plugin_id)) {
			latestByPlugin.set(output.plugin_id, output);
		}
	}
	cachedLatestPluginOutputs = [...latestByPlugin.values()].sort((a, b) => a.plugin_id.localeCompare(b.plugin_id));
	return cachedLatestPluginOutputs;
}

export function loadPluginFilterOptions(): PluginFilterOption[] {
	const configuredPlugins = loadSettingsConfig().post_collect.plugins;
	const pluginSettings = new Map(configuredPlugins.map((plugin) => [plugin.id, plugin]));
	const pluginOrder = new Map(configuredPlugins.map((plugin, index) => [plugin.id, index]));
	const labelsByPlugin = new Map<string, Set<string>>();
	const intentsByPlugin = new Map<string, Record<string, LabelIntent>>();
	for (const output of loadLatestPluginOutputs()) {
		const labels = labelsByPlugin.get(output.plugin_id) ?? new Set<string>();
		const intents = intentsByPlugin.get(output.plugin_id) ?? {};
		for (const [label, intent] of Object.entries(output.label_intents ?? {})) {
			if (label) {
				labels.add(label);
				intents[label] = intent;
			}
		}
		for (const result of Object.values(output.results ?? {})) {
			if (result?.label) labels.add(result.label);
		}
		labelsByPlugin.set(output.plugin_id, labels);
		intentsByPlugin.set(output.plugin_id, intents);
	}
	return [...labelsByPlugin.entries()]
		.map(([plugin_id, labels]) => {
			const shortLabel = pluginSettings.get(plugin_id)?.short_label;
			const labelIntents = intentsByPlugin.get(plugin_id);
			return {
				plugin_id,
				labels: [...labels].sort(),
				...(shortLabel ? { short_label: shortLabel } : {}),
				...(labelIntents && Object.keys(labelIntents).length > 0 ? { label_intents: labelIntents } : {}),
			};
		})
		.sort((a, b) => {
			const orderA = pluginOrder.get(a.plugin_id) ?? Number.MAX_SAFE_INTEGER;
			const orderB = pluginOrder.get(b.plugin_id) ?? Number.MAX_SAFE_INTEGER;
			return orderA === orderB ? a.plugin_id.localeCompare(b.plugin_id) : orderA - orderB;
		});
}

function getSkillOwnerFromKey(skillKey: string): string | null {
	const parts = skillKey.split('/');
	return parts.length >= 4 ? parts[1] : null;
}

function computeMinimalUniquePrefixes(labels: string[]): Record<string, string> {
	const uniqueLabels = [...new Set(labels.filter((label) => label.length > 0))].sort((a, b) => a.localeCompare(b));
	const lowered = uniqueLabels.map((label) => label.toLocaleLowerCase());
	const prefixes: Record<string, string> = {};

	for (const [index, label] of uniqueLabels.entries()) {
		const lower = lowered[index];
		let prefix = label;

		for (let length = 1; length <= label.length; length++) {
			const candidate = lower.slice(0, length);
			const isUnique = lowered.every((other, otherIndex) => otherIndex === index || !other.startsWith(candidate));
			if (isUnique) {
				prefix = label.slice(0, length);
				break;
			}
		}

		prefixes[label] = prefix;
	}

	return prefixes;
}

export function loadPluginHistorySummaries(): Record<string, PluginHistorySummary> {
	if (!dev && cachedPluginHistorySummaries) return cachedPluginHistorySummaries;

	const { orgName } = loadCatalog();
	const configuredPlugins = loadSettingsConfig().post_collect.plugins;
	const pluginOrder = new Map(configuredPlugins.map((plugin, index) => [plugin.id, index]));
	const summaries: Record<string, PluginHistorySummary> = {};

	for (const output of loadPluginOutputHistory()) {
		if (!output.collect_id) continue;
		const collectSummary = (summaries[output.collect_id] ??= {});
		const pluginSummary = (collectSummary[output.plugin_id] ??= {});

		for (const [skillKey, result] of Object.entries(output.results ?? {})) {
			if (!result?.label) continue;
			const labelSummary = (pluginSummary[result.label] ??= { org: 0, community: 0 });
			const owner = getSkillOwnerFromKey(skillKey);
			if (orgName != null && owner === orgName) {
				labelSummary.org++;
			} else {
				labelSummary.community++;
			}
		}
	}

	for (const collectSummary of Object.values(summaries)) {
		for (const pluginId of Object.keys(collectSummary)) {
			const orderedLabels = Object.keys(collectSummary[pluginId]).sort((a, b) => a.localeCompare(b));
			collectSummary[pluginId] = Object.fromEntries(
				orderedLabels.map((label) => [label, collectSummary[pluginId][label]]),
			);
		}
	}

	cachedPluginHistorySummaries = Object.fromEntries(
		Object.entries(summaries).sort((a, b) => b[0].localeCompare(a[0])).map(([collectId, collectSummary]) => [
			collectId,
			Object.fromEntries(
				Object.entries(collectSummary).sort(([pluginA], [pluginB]) => {
					const orderA = pluginOrder.get(pluginA) ?? Number.MAX_SAFE_INTEGER;
					const orderB = pluginOrder.get(pluginB) ?? Number.MAX_SAFE_INTEGER;
					return orderA === orderB ? pluginA.localeCompare(pluginB) : orderA - orderB;
				}),
			),
		]),
	);

	return cachedPluginHistorySummaries;
}

export function loadPluginHistoryColumns(): PluginHistoryColumn[] {
	if (!dev && cachedPluginHistoryColumns) return cachedPluginHistoryColumns;

	const configuredPlugins = loadSettingsConfig().post_collect.plugins;
	const pluginSettings = new Map(configuredPlugins.map((plugin) => [plugin.id, plugin]));
	const pluginOrder = new Map(configuredPlugins.map((plugin, index) => [plugin.id, index]));
	const labelsByPlugin = new Map<string, Set<string>>();
	const intentLabelsByPlugin = new Map<string, Set<string>>();
	const intentsByPlugin = new Map<string, Record<string, LabelIntent>>();

	for (const output of loadPluginOutputHistory()) {
		const labels = labelsByPlugin.get(output.plugin_id) ?? new Set<string>();
		const intentLabels = intentLabelsByPlugin.get(output.plugin_id) ?? new Set<string>();
		const labelIntents = intentsByPlugin.get(output.plugin_id) ?? {};
		for (const [label, intent] of Object.entries(output.label_intents ?? {})) {
			if (label) {
				labels.add(label);
				intentLabels.add(label);
				labelIntents[label] = intent;
			}
		}
		labelsByPlugin.set(output.plugin_id, labels);
		intentLabelsByPlugin.set(output.plugin_id, intentLabels);
		intentsByPlugin.set(output.plugin_id, labelIntents);
	}

	for (const collectSummary of Object.values(loadPluginHistorySummaries())) {
		for (const [pluginId, labelCounts] of Object.entries(collectSummary)) {
			const labels = labelsByPlugin.get(pluginId) ?? new Set<string>();
			for (const label of Object.keys(labelCounts)) labels.add(label);
			labelsByPlugin.set(pluginId, labels);
		}
	}

	cachedPluginHistoryColumns = [...labelsByPlugin.entries()]
		.map(([plugin_id, labels]) => {
			const shortLabel = pluginSettings.get(plugin_id)?.short_label;
			const orderedLabels = [...labels].sort((a, b) => a.localeCompare(b));
			const orderedIntentLabels = [...(intentLabelsByPlugin.get(plugin_id) ?? new Set<string>())].sort((a, b) =>
				a.localeCompare(b),
			);
			return {
				plugin_id,
				...(shortLabel ? { short_label: shortLabel } : {}),
				labels: orderedLabels,
				intent_labels: orderedIntentLabels,
				...(Object.keys(intentsByPlugin.get(plugin_id) ?? {}).length > 0
					? { label_intents: intentsByPlugin.get(plugin_id) }
					: {}),
				label_abbreviations: computeMinimalUniquePrefixes(orderedLabels),
			};
		})
		.sort((a, b) => {
			const orderA = pluginOrder.get(a.plugin_id) ?? Number.MAX_SAFE_INTEGER;
			const orderB = pluginOrder.get(b.plugin_id) ?? Number.MAX_SAFE_INTEGER;
			return orderA === orderB ? a.plugin_id.localeCompare(b.plugin_id) : orderA - orderB;
		});

	return cachedPluginHistoryColumns;
}
