import { load as yamlLoad } from 'js-yaml';

export function parseFrontmatter(content: string): Record<string, unknown> {
	if (!content.startsWith('---')) return {};
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) return {};

	try {
		const parsed = yamlLoad(match[1]);
		if (!parsed || typeof parsed !== 'object') return {};
		const frontmatter = { ...(parsed as Record<string, unknown>) };
		delete frontmatter._excerpt;
		return frontmatter;
	} catch {
		return {};
	}
}
