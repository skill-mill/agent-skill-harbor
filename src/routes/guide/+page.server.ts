import { loadDocContent } from '$lib/server/docs';

export const load = () => {
	const contentEn = loadDocContent('', 'en');
	const contentJa = loadDocContent('', 'ja');

	return {
		title: { en: 'Agent Skill Harbor', ja: 'Agent Skill Harbor' },
		content: {
			en: contentEn ?? '',
			ja: contentJa ?? contentEn ?? '',
		},
	};
};
