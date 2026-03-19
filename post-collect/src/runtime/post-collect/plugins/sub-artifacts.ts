import { join } from 'node:path';

export function normalizeSkillKeyForArtifactPath(skillKey: string): string {
	return skillKey.replace(/[^a-zA-Z0-9_-]+/g, '__').replace(/^_+|_+$/g, '');
}

export function getPluginArtifactPublicDir(pluginId: string, skillKey: string): string {
	return `assets/plugins/${pluginId}/${normalizeSkillKeyForArtifactPath(skillKey)}`;
}

export function getPluginArtifactFsDir(projectRoot: string, pluginId: string, skillKey: string): string {
	return join(projectRoot, 'data', getPluginArtifactPublicDir(pluginId, skillKey));
}

export function getPluginArtifactsRoot(projectRoot: string, pluginId: string): string {
	return join(projectRoot, 'data', 'assets', 'plugins', pluginId);
}
