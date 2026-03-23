import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { getGenTemplate, listGenTemplateIds, scaffoldPlugin } from './gen.js';

test('scaffoldPlugin creates plugins/example-user-defined-plugin from template', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-gen-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-'));
	const templateDir = join(packageRoot, 'templates', 'gen', 'example-user-defined-plugin');
	mkdirSync(templateDir, { recursive: true });
	writeFileSync(join(templateDir, 'index.ts'), 'export const sample = true;\n');

	const targetDir = scaffoldPlugin(packageRoot, root, 'example-user-defined-plugin');

	assert.equal(targetDir, join(root, 'plugins', 'example-user-defined-plugin'));
	assert.equal(existsSync(join(root, 'plugins', 'example-user-defined-plugin', 'index.ts')), true);
	assert.equal(
		readFileSync(join(root, 'plugins', 'example-user-defined-plugin', 'index.ts'), 'utf-8'),
		'export const sample = true;\n',
	);
});

test('scaffoldPlugin creates notify-slack package files from template', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-gen-notify-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-notify-'));
	const templateDir = join(packageRoot, 'templates', 'gen', 'notify-slack');
	mkdirSync(templateDir, { recursive: true });
	writeFileSync(join(templateDir, 'index.ts'), 'export const notify = true;\n');
	writeFileSync(join(templateDir, 'package.json'), '{ "dependencies": { "js-yaml": "^4.1.0" } }\n');

	const targetDir = scaffoldPlugin(packageRoot, root, 'notify-slack');

	assert.equal(targetDir, join(root, 'plugins', 'notify-slack'));
	assert.equal(readFileSync(join(targetDir, 'index.ts'), 'utf-8'), 'export const notify = true;\n');
	assert.equal(readFileSync(join(targetDir, 'package.json'), 'utf-8'), '{ "dependencies": { "js-yaml": "^4.1.0" } }\n');
});

test('scaffoldPlugin rejects existing target', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-gen-existing-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-existing-'));
	const templateDir = join(packageRoot, 'templates', 'gen', 'example-user-defined-plugin');
	const targetDir = join(root, 'plugins', 'example-user-defined-plugin');
	mkdirSync(templateDir, { recursive: true });
	mkdirSync(targetDir, { recursive: true });

	assert.throws(() => scaffoldPlugin(packageRoot, root, 'example-user-defined-plugin'), /Target already exists/);
});

test('gen template registry exposes supported plugin templates', () => {
	assert.deepEqual(listGenTemplateIds(), ['example-user-defined-plugin', 'notify-slack']);
	assert.equal(getGenTemplate('notify-slack')?.generatedLabel, 'notify-slack plugin');
});
