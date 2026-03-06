import { loadCatalog } from '$lib/server/catalog';

export const prerender = true;
export const trailingSlash = 'always';

export const load = () => {
	const { orgName, repoFullName, freshPeriodDays, skills } = loadCatalog();
	return { orgName, repoFullName, freshPeriodDays, skills };
};
