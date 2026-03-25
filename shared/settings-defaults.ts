export const DEFAULT_HISTORY_LIMIT = 50;
export const DEFAULT_POST_COLLECT_PLUGIN_IDS = ['builtin.detect-drift'] as const;

export function createDefaultPostCollectPlugins(): Array<{ id: string }> {
	return DEFAULT_POST_COLLECT_PLUGIN_IDS.map((id) => ({ id }));
}
