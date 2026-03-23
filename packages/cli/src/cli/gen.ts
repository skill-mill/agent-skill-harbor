import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface GenTemplateDefinition {
	id: string;
	generatedLabel: string;
	nextSteps: string[];
}

export const GEN_TEMPLATES: Record<string, GenTemplateDefinition> = {
	'example-user-defined-plugin': {
		id: 'example-user-defined-plugin',
		generatedLabel: 'example user-defined plugin',
		nextSteps: ['uncomment `- id: example-user-defined-plugin` in config/harbor.yaml'],
	},
	'notify-slack': {
		id: 'notify-slack',
		generatedLabel: 'notify-slack plugin',
		nextSteps: [
			'uncomment `- id: notify-slack` in config/harbor.yaml',
			'install plugin dependencies: `pnpm install --dir plugins/notify-slack` (or `npm install --prefix plugins/notify-slack`)',
		],
	},
};

export function getGenTemplate(templateId: string): GenTemplateDefinition | undefined {
	return GEN_TEMPLATES[templateId];
}

export function listGenTemplateIds(): string[] {
	return Object.keys(GEN_TEMPLATES).sort();
}

export function scaffoldPlugin(packageRoot: string, projectRoot: string, templateId: string): string {
	const template = getGenTemplate(templateId);
	if (!template) {
		throw new Error(`Unknown plugin template: ${templateId}`);
	}
	const templateDir = resolve(packageRoot, 'templates/gen', template.id);
	const targetDir = join(projectRoot, 'plugins', template.id);

	if (existsSync(targetDir)) {
		throw new Error(`Target already exists: ${targetDir}`);
	}

	mkdirSync(join(projectRoot, 'plugins'), { recursive: true });
	cpSync(templateDir, targetDir, { recursive: true });
	return targetDir;
}
