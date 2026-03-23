import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { tsImport } from 'tsx/esm/api';
import { auditPromptfooSecurityPlugin } from './plugins/audit-promptfoo-security.js';
import { auditSkillScannerPlugin } from './plugins/audit-skill-scanner.js';
import { detectDriftPlugin } from './plugins/detect-drift.js';
import type {
	BuiltinPostCollectPlugin,
	LabelIntent,
	PostCollectCatalog,
	PostCollectPluginConfig,
	PostCollectPluginContext,
	PostCollectPluginModule,
	PostCollectPluginResult,
	PostCollectSettings,
} from './types.js';

const BUILTIN_PLUGINS = new Map<string, BuiltinPostCollectPlugin>([
	[detectDriftPlugin.id, detectDriftPlugin],
	[auditPromptfooSecurityPlugin.id, auditPromptfooSecurityPlugin],
	[auditSkillScannerPlugin.id, auditSkillScannerPlugin],
]);

interface RawSettings {
	collector?: {
		history_limit?: number;
	};
	post_collect?: {
		plugins?: PostCollectPluginConfig[];
	};
}

interface SavedPluginOutputEntry extends PostCollectPluginResult {
	generated_at: string;
	collect_id?: string;
}

function getPluginOutputPath(projectRoot: string, pluginId: string): string {
	return join(projectRoot, 'data', 'plugins', `${pluginId}.yaml`);
}

function loadPostCollectSettings(projectRoot: string): PostCollectSettings {
	const settingsPath = join(projectRoot, 'config', 'harbor.yaml');
	if (!existsSync(settingsPath)) {
		return { plugins: [{ id: 'builtin.detect-drift' }] };
	}
	try {
		const raw = yamlLoad(readFileSync(settingsPath, 'utf-8')) as RawSettings | null;
		return {
			plugins: raw?.post_collect?.plugins ?? [{ id: 'builtin.detect-drift' }],
		};
	} catch {
		return { plugins: [{ id: 'builtin.detect-drift' }] };
	}
}

function loadHistoryLimit(projectRoot: string): number {
	const settingsPath = join(projectRoot, 'config', 'harbor.yaml');
	if (!existsSync(settingsPath)) {
		return 50;
	}
	try {
		const raw = yamlLoad(readFileSync(settingsPath, 'utf-8')) as RawSettings | null;
		return raw?.collector?.history_limit ?? 50;
	} catch {
		return 50;
	}
}

function validateIntent(intent: string | undefined): LabelIntent {
	if (intent === 'neutral' || intent === 'info' || intent === 'success' || intent === 'warn' || intent === 'danger') {
		return intent;
	}
	return 'neutral';
}

function normalizePluginResult(result: PostCollectPluginResult | null | undefined): PostCollectPluginResult {
	const next: PostCollectPluginResult = {};
	if (result?.persist === false) next.persist = false;
	if (result?.summary) next.summary = String(result.summary);
	if (result?.label_intents) {
		next.label_intents = Object.fromEntries(
			Object.entries(result.label_intents).map(([label, intent]) => [label, validateIntent(intent)]),
		);
	}
	if (Array.isArray(result?.sub_artifacts)) {
		next.sub_artifacts = result.sub_artifacts.filter(
			(artifact): artifact is string => typeof artifact === 'string' && artifact.length > 0,
		);
	}
	if (result?.results) {
		next.results = Object.fromEntries(
			Object.entries(result.results).map(([skillKey, value]) => [
				skillKey,
				value && typeof value === 'object' ? value : {},
			]),
		);
	}
	return next;
}

function isValidUserPluginId(pluginId: string): boolean {
	return /^[a-z0-9][a-z0-9_-]*$/.test(pluginId);
}

function resolveUserPluginPath(projectRoot: string, pluginId: string): string {
	if (!isValidUserPluginId(pluginId)) {
		throw new Error(`Invalid user plugin id "${pluginId}". Use only lowercase letters, numbers, "-" and "_".`);
	}

	const baseDir = join(projectRoot, 'plugins', pluginId);
	const candidates = ['index.mjs', 'index.js', 'index.ts'].map((name) => join(baseDir, name));
	const resolved = candidates.find((candidate) => existsSync(candidate));
	if (!resolved) {
		throw new Error(
			`Post-collect plugin "${pluginId}" was not found. Expected one of: ${candidates.map((candidate) => `"${candidate}"`).join(', ')}`,
		);
	}
	return resolved;
}

async function loadUserPlugin(projectRoot: string, pluginId: string): Promise<PostCollectPluginModule> {
	const modulePath = resolveUserPluginPath(projectRoot, pluginId);
	const imported = (await tsImport(modulePath, pathToFileURL(modulePath).href)) as Partial<PostCollectPluginModule> & {
		default?: Partial<PostCollectPluginModule>;
	};
	const candidate = imported.default?.run ? imported.default : imported;
	if (typeof candidate.run !== 'function') {
		throw new Error(`Plugin "${pluginId}" must export run(context).`);
	}
	return candidate as PostCollectPluginModule;
}

function loadPluginOutputHistory(projectRoot: string, pluginId: string): SavedPluginOutputEntry[] {
	const outputPath = getPluginOutputPath(projectRoot, pluginId);
	if (!existsSync(outputPath)) return [];
	try {
		const raw = yamlLoad(readFileSync(outputPath, 'utf-8'));
		return Array.isArray(raw) ? (raw as SavedPluginOutputEntry[]) : [];
	} catch {
		return [];
	}
}

function savePluginOutput(
	projectRoot: string,
	pluginId: string,
	collectId: string | null,
	result: PostCollectPluginResult,
): void {
	const outputPath = getPluginOutputPath(projectRoot, pluginId);
	const historyLimit = loadHistoryLimit(projectRoot);
	mkdirSync(dirname(outputPath), { recursive: true });
	const { persist: _persist, ...savedResult } = result;
	const payload: SavedPluginOutputEntry = {
		generated_at: new Date().toISOString(),
		...(collectId ? { collect_id: collectId } : {}),
		...savedResult,
	};
	const existing = loadPluginOutputHistory(projectRoot, pluginId).filter(
		(entry) => !(collectId && entry.collect_id === collectId),
	);
	const next = [payload, ...existing];
	const trimmed = historyLimit > 0 ? next.slice(0, historyLimit) : next;
	writeFileSync(outputPath, yamlDump(trimmed, { lineWidth: 0, noRefs: true }));
}

export interface RunPostCollectOptions {
	projectRoot: string;
	collectId?: string | null;
	orgName?: string;
	catalog: PostCollectCatalog;
	log?: boolean;
	plugins?: PostCollectPluginConfig[];
}

export async function runPostCollect(options: RunPostCollectOptions): Promise<void> {
	const log = options.log ?? true;
	const settings = loadPostCollectSettings(options.projectRoot);
	const plugins = options.plugins ?? settings.plugins;
	const contextBase: Omit<PostCollectPluginContext, 'plugin_id'> = {
		schema_version: 1,
		project_root: options.projectRoot,
		collect_id: options.collectId ?? null,
		...(options.orgName ? { org_name: options.orgName } : {}),
		paths: {
			data_dir: join(options.projectRoot, 'data'),
			catalog_yaml: join(options.projectRoot, 'data', 'skills.yaml'),
			skills_dir: join(options.projectRoot, 'data', 'skills'),
			collects_yaml: join(options.projectRoot, 'data', 'collects.yaml'),
		},
		catalog: options.catalog,
	};

	if (plugins.length === 0) {
		if (log) console.log('No post_collect plugins configured. Skipping.');
		return;
	}

	if (log) console.log(`Running post_collect plugins: ${plugins.map((plugin) => plugin.id).join(', ')}`);

	for (const plugin of plugins) {
		const builtIn = BUILTIN_PLUGINS.get(plugin.id);
		const context: PostCollectPluginContext = {
			...contextBase,
			plugin_id: plugin.id,
			...(plugin.config ? { plugin_config: plugin.config } : {}),
		};
		const outputPath = getPluginOutputPath(options.projectRoot, plugin.id);
		if (log) console.log(`  -> ${plugin.id} (start)`);
		const result = builtIn
			? await builtIn.run(context)
			: await (await loadUserPlugin(options.projectRoot, plugin.id)).run(context);
		const normalizedResult = normalizePluginResult(result);
		const shouldPersist = normalizedResult.persist !== false;
		if (shouldPersist) {
			savePluginOutput(options.projectRoot, plugin.id, options.collectId ?? null, normalizedResult);
		}
		if (log) {
			console.log(`     ${plugin.id} (done)`);
			if (normalizedResult.summary) {
				console.log(`     summary: ${normalizedResult.summary}`);
			}
			if (shouldPersist) {
				console.log(`     saved: ${outputPath}`);
			} else {
				console.log('     persist: false (skipped saving plugin output)');
			}
		}
	}
}
