import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { listDocs } from '$lib/server/docs';

export const load = () => {
	const docs = listDocs();
	const first = docs[0]?.slug ?? '01-organization-setup';
	redirect(302, `${base}/docs/${first}/`);
};
