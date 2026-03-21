import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function scaffoldExampleUserDefinedPlugin(packageRoot: string, projectRoot: string): string {
	const templateDir = resolve(packageRoot, 'templates/gen/example-user-defined-plugin');
	const targetDir = join(projectRoot, 'plugins', 'example-user-defined-plugin');

	if (existsSync(targetDir)) {
		throw new Error(`Target already exists: ${targetDir}`);
	}

	mkdirSync(join(projectRoot, 'plugins'), { recursive: true });
	cpSync(templateDir, targetDir, { recursive: true });
	return targetDir;
}
