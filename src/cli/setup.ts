import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface SetupTemplateDefinition {
	id: string;
	generatedLabel: string;
	nextSteps: string[];
}

export const SETUP_TEMPLATES: Record<string, SetupTemplateDefinition> = {
	'example-user-defined-plugin': {
		id: 'example-user-defined-plugin',
		generatedLabel: 'example user-defined plugin',
		nextSteps: [
			'uncomment `- id: example-user-defined-plugin` in config/harbor.yaml',
			'run `pnpm install --dir collector` (or `npm install --prefix collector`) if collector dependencies are not installed yet',
		],
	},
	'builtin.audit-promptfoo-security': {
		id: 'builtin.audit-promptfoo-security',
		generatedLabel: 'promptfoo security plugin manifest',
		nextSteps: [
			'uncomment `- id: builtin.audit-promptfoo-security` in config/harbor.yaml',
			'install plugin dependencies: `pnpm install --dir collector/plugins/builtin.audit-promptfoo-security` (or `npm install --prefix collector/plugins/builtin.audit-promptfoo-security`)',
		],
	},
	'builtin.audit-skill-scanner': {
		id: 'builtin.audit-skill-scanner',
		generatedLabel: 'skill-scanner plugin requirements file',
		nextSteps: [
			'uncomment `- id: builtin.audit-skill-scanner` in config/harbor.yaml',
			'install Python dependencies with `uv pip install -r collector/plugins/builtin.audit-skill-scanner/requirements.txt` (or `pip install -r collector/plugins/builtin.audit-skill-scanner/requirements.txt`)',
		],
	},
};

export function getSetupTemplate(templateId: string): SetupTemplateDefinition | undefined {
	return SETUP_TEMPLATES[templateId];
}

export function listSetupTemplateIds(): string[] {
	return Object.keys(SETUP_TEMPLATES).sort();
}

export function scaffoldPluginSurface(packageRoot: string, projectRoot: string, templateId: string): string {
	const template = getSetupTemplate(templateId);
	if (!template) {
		throw new Error(`Unknown plugin template: ${templateId}`);
	}
	const templateDir = resolve(packageRoot, 'templates/setup', template.id);
	const targetDir = join(projectRoot, 'collector', 'plugins', template.id);

	if (existsSync(targetDir)) {
		throw new Error(`Target already exists: ${targetDir}`);
	}

	mkdirSync(join(projectRoot, 'collector', 'plugins'), { recursive: true });
	cpSync(templateDir, targetDir, { recursive: true });
	return targetDir;
}
