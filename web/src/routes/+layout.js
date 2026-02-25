import { base } from '$app/paths';

export const prerender = true;
export const trailingSlash = 'always';

/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch }) {
	const response = await fetch(`${base}/catalog.json`);
	const catalog = await response.json();
	return { orgName: catalog.org_name ?? null };
}
