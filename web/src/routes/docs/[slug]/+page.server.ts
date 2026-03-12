import { error } from '@sveltejs/kit';
import { listDocs, loadDocContent } from '$lib/server/docs';

export const entries = () => {
	return listDocs()
		.filter((d) => d.slug !== '')
		.map((d) => ({ slug: d.slug }));
};

export const load = ({ params }) => {
	const docs = listDocs();
	const doc = docs.find((d) => d.slug === params.slug);
	if (!doc) error(404, 'Document not found');

	const contentEn = loadDocContent(params.slug, 'en');
	const contentJa = loadDocContent(params.slug, 'ja');
	if (!contentEn) error(404, 'Document not found');

	return {
		slug: params.slug,
		title: doc.title,
		content: {
			en: contentEn,
			ja: contentJa ?? contentEn,
		},
	};
};
