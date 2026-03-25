import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadRuntimeSettings } from './settings.js';

export interface EnabledPluginManifestInfo {
	enabledPluginIds: string[];
	hasPython: boolean;
}

export function detectEnabledPluginManifests(projectRoot: string): EnabledPluginManifestInfo {
	const enabledPluginIds = loadRuntimeSettings(projectRoot)
		.plugins.map((plugin) => (plugin && typeof plugin === 'object' && typeof plugin.id === 'string' ? plugin.id : null))
		.filter((pluginId): pluginId is string => Boolean(pluginId));

	const hasPython = enabledPluginIds.some((pluginId) =>
		existsSync(join(projectRoot, 'collector', 'plugins', pluginId, 'requirements.txt')),
	);

	return { enabledPluginIds, hasPython };
}
