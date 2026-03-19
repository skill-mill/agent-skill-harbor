import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { scaffoldSamplePlugin } from './gen.js';

test('scaffoldSamplePlugin creates plugins/example_user_defined_plugin from template', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-gen-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-'));
	const templateDir = join(packageRoot, 'templates', 'gen', 'sample-plugin');
	mkdirSync(templateDir, { recursive: true });
	writeFileSync(join(templateDir, 'index.ts'), 'export const sample = true;\n');

	const targetDir = scaffoldSamplePlugin(packageRoot, root);

	assert.equal(targetDir, join(root, 'plugins', 'example_user_defined_plugin'));
	assert.equal(existsSync(join(root, 'plugins', 'example_user_defined_plugin', 'index.ts')), true);
	assert.equal(
		readFileSync(join(root, 'plugins', 'example_user_defined_plugin', 'index.ts'), 'utf-8'),
		'export const sample = true;\n',
	);
});

test('scaffoldSamplePlugin rejects existing target', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-gen-existing-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-existing-'));
	const templateDir = join(packageRoot, 'templates', 'gen', 'sample-plugin');
	const targetDir = join(root, 'plugins', 'example_user_defined_plugin');
	mkdirSync(templateDir, { recursive: true });
	mkdirSync(targetDir, { recursive: true });

	assert.throws(() => scaffoldSamplePlugin(packageRoot, root), /Target already exists/);
});
