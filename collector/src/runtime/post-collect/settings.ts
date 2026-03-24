import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import type { PostCollectPluginConfig, PostCollectSettings } from './types.js';

interface RawSettings {
	collector?: {
		history_limit?: number;
	};
	post_collect?: {
		plugins?: PostCollectPluginConfig[];
	};
}

export const DEFAULT_POST_COLLECT_PLUGINS: PostCollectPluginConfig[] = [{ id: 'builtin.detect-drift' }];
export const DEFAULT_HISTORY_LIMIT = 50;

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

export function loadConfiguredPostCollectPlugins(projectRoot: string): PostCollectPluginConfig[] | null {
	return loadRawSettings(projectRoot)?.post_collect?.plugins ?? null;
}

export function loadPostCollectSettings(projectRoot: string): PostCollectSettings {
	return {
		plugins: loadConfiguredPostCollectPlugins(projectRoot) ?? DEFAULT_POST_COLLECT_PLUGINS,
	};
}

export function loadHistoryLimit(projectRoot: string): number {
	return loadRawSettings(projectRoot)?.collector?.history_limit ?? DEFAULT_HISTORY_LIMIT;
}
