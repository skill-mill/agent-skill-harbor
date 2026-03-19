import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function scaffoldSamplePlugin(packageRoot: string, projectRoot: string): string {
	const templateDir = resolve(packageRoot, 'templates/gen/sample-plugin');
	const targetDir = join(projectRoot, 'plugins', 'example_user_defined_plugin');

	if (existsSync(targetDir)) {
		throw new Error(`Target already exists: ${targetDir}`);
	}

	mkdirSync(join(projectRoot, 'plugins'), { recursive: true });
	cpSync(templateDir, targetDir, { recursive: true });
	return targetDir;
}
