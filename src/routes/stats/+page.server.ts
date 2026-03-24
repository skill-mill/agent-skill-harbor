import { loadPluginHistoryColumns, loadPluginHistorySummaries } from '$lib/server/catalog';

export const prerender = true;

export const load = async ({ parent }) => {
	const parentData = await parent();
	const pluginHistoryColumns = loadPluginHistoryColumns();
	const pluginHistorySummaries = loadPluginHistorySummaries();

	return {
		...parentData,
		pluginHistoryColumns,
		pluginHistorySummaries,
	};
};
