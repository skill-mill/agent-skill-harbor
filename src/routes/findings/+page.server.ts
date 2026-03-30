import { loadLatestHighlightedFindings } from '$lib/server/catalog';

export const prerender = true;

export const load = async ({ parent }) => {
	const { orgName, repoFullName, freshPeriodDays, skills, repos, collections, pluginFilterOptions, settings } =
		await parent();
	const findings = loadLatestHighlightedFindings();

	return {
		orgName,
		repoFullName,
		freshPeriodDays,
		skills,
		repos,
		collections,
		pluginFilterOptions,
		settings,
		findings,
	};
};
