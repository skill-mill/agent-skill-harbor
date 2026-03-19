import { error } from '@sveltejs/kit';
import { getSkillBody, loadCatalog, loadLatestPluginOutputs } from '$lib/server/catalog';

export const prerender = 'auto';

export const entries = () => {
	const { skills } = loadCatalog();
	return skills.map((skill) => ({ path: skill.key }));
};

export const load = ({ params }) => {
	const { skills, freshPeriodDays } = loadCatalog();
	const path = params.path.replace(/\/+$/, '');
	const skill = skills.find((s) => s.key === path);

	if (!skill) throw error(404, 'Skill not found');

	const pluginOutputs = loadLatestPluginOutputs()
		.map((output) => ({
			id: output.plugin_id,
			labelIntents: output.label_intents ?? {},
			subArtifacts: output.sub_artifacts ?? [],
			result: output.results?.[skill.key] ?? null,
		}))
		.filter((entry) => entry.result != null);

	return { skill, allSkills: skills, body: getSkillBody(skill.key), freshPeriodDays, pluginOutputs };
};
