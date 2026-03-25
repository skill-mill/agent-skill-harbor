import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import { createDefaultPostCollectPlugins, DEFAULT_HISTORY_LIMIT } from '../../../../shared/settings-defaults.js';
import type { PostCollectPluginConfig } from './types.js';

interface RawSettings {
	collector?: {
		history_limit?: number;
	};
	post_collect?: {
		plugins?: PostCollectPluginConfig[];
	};
}

function loadRawSettings(projectRoot: string): RawSettings | null {
	const settingsPath = join(projectRoot, 'config', 'harbor.yaml');
	if (!existsSync(settingsPath)) {
		return null;
	}

	try {
		return (yamlLoad(readFileSync(settingsPath, 'utf-8')) as RawSettings | null) ?? null;
	} catch {
		return null;
	}
}

export interface RuntimeSettings {
	history_limit: number;
	plugins: PostCollectPluginConfig[];
}

export function loadRuntimeSettings(projectRoot: string): RuntimeSettings {
	const raw = loadRawSettings(projectRoot);
	return {
		history_limit: raw?.collector?.history_limit ?? DEFAULT_HISTORY_LIMIT,
		plugins: raw?.post_collect?.plugins ?? createDefaultPostCollectPlugins(),
	};
}
