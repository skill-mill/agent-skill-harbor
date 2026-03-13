import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const cliPackagePath = join(projectRoot, 'cli', 'package.json');
const webPackagePath = join(projectRoot, 'web', 'package.json');
const templatePackagePath = join(projectRoot, 'cli', 'templates', 'init', 'package.template.json');

function readJson<T>(filePath: string): T {
	return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

const cliPackage = readJson<Record<string, any>>(cliPackagePath);
const webPackage = readJson<Record<string, any>>(webPackagePath);
const templateRaw = readFileSync(templatePackagePath, 'utf-8');

const errors: string[] = [];
const cliVersion = cliPackage.version;

if (webPackage.version !== cliVersion) {
	errors.push(`web/package.json version (${webPackage.version}) does not match cli/package.json version (${cliVersion})`);
}

if (!templateRaw.includes('"agent-skill-harbor": "^{{PACKAGE_VERSION}}"')) {
	errors.push('cli/templates/init/package.template.json must use ^{{PACKAGE_VERSION}} placeholder');
}

if (!cliPackage.dependencies || cliPackage.dependencies['agent-skill-harbor-web'] !== `workspace:^${cliVersion}`) {
	errors.push(`cli/package.json dependency agent-skill-harbor-web must be workspace:^${cliVersion}`);
}

if (errors.length > 0) {
	for (const error of errors) {
		console.error(`Version check failed: ${error}`);
	}
	process.exit(1);
}

console.log(`Version check passed: ${cliVersion}`);
