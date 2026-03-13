import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const cliPackagePath = join(projectRoot, 'cli', 'package.json');
const webPackagePath = join(projectRoot, 'web', 'package.json');

function readJson<T>(filePath: string): T {
	return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, value: unknown): void {
	writeFileSync(filePath, `${JSON.stringify(value, null, '\t')}\n`);
}

const cliPackage = readJson<Record<string, any>>(cliPackagePath);
const version = cliPackage.version;

if (typeof version !== 'string' || version.length === 0) {
	throw new Error('cli/package.json version is missing');
}

cliPackage.dependencies = {
	...(cliPackage.dependencies ?? {}),
	'agent-skill-harbor-web': `workspace:^${version}`,
};
writeJson(cliPackagePath, cliPackage);

const webPackage = readJson<Record<string, any>>(webPackagePath);
webPackage.version = version;
writeJson(webPackagePath, webPackage);

console.log(`Synchronized versions to ${version}`);
console.log(`  - cli/package.json dependency agent-skill-harbor-web -> workspace:^${version}`);
console.log(`  - web/package.json`);
