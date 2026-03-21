import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { scaffoldExampleUserDefinedPlugin } from './gen.js';

test('scaffoldExampleUserDefinedPlugin creates plugins/example-user-defined-plugin from template', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-gen-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-'));
	const templateDir = join(packageRoot, 'templates', 'gen', 'example-user-defined-plugin');
	mkdirSync(templateDir, { recursive: true });
	writeFileSync(join(templateDir, 'index.ts'), 'export const sample = true;\n');

	const targetDir = scaffoldExampleUserDefinedPlugin(packageRoot, root);

	assert.equal(targetDir, join(root, 'plugins', 'example-user-defined-plugin'));
	assert.equal(existsSync(join(root, 'plugins', 'example-user-defined-plugin', 'index.ts')), true);
	assert.equal(
		readFileSync(join(root, 'plugins', 'example-user-defined-plugin', 'index.ts'), 'utf-8'),
		'export const sample = true;\n',
	);
});

test('scaffoldExampleUserDefinedPlugin rejects existing target', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-gen-existing-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-existing-'));
	const templateDir = join(packageRoot, 'templates', 'gen', 'example-user-defined-plugin');
	const targetDir = join(root, 'plugins', 'example-user-defined-plugin');
	mkdirSync(templateDir, { recursive: true });
	mkdirSync(targetDir, { recursive: true });

	assert.throws(() => scaffoldExampleUserDefinedPlugin(packageRoot, root), /Target already exists/);
});
