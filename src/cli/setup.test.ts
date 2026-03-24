import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { getSetupTemplate, listSetupTemplateIds, scaffoldPluginSurface } from './setup.js';

test('scaffoldPluginSurface creates collector/plugins/example-user-defined-plugin from template', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-setup-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-'));
	const templateDir = join(packageRoot, 'templates', 'setup', 'example-user-defined-plugin');
	mkdirSync(templateDir, { recursive: true });
	writeFileSync(join(templateDir, 'index.ts'), 'export const sample = true;\n');

	const targetDir = scaffoldPluginSurface(packageRoot, root, 'example-user-defined-plugin');

	assert.equal(targetDir, join(root, 'collector', 'plugins', 'example-user-defined-plugin'));
	assert.equal(existsSync(join(root, 'collector', 'plugins', 'example-user-defined-plugin', 'index.ts')), true);
	assert.equal(
		readFileSync(join(root, 'collector', 'plugins', 'example-user-defined-plugin', 'index.ts'), 'utf-8'),
		'export const sample = true;\n',
	);
});

test('scaffoldPluginSurface creates promptfoo plugin package files from template', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-setup-promptfoo-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-promptfoo-'));
	const templateDir = join(packageRoot, 'templates', 'setup', 'builtin.audit-promptfoo-security');
	mkdirSync(templateDir, { recursive: true });
	writeFileSync(join(templateDir, 'package.json'), '{ "dependencies": { "promptfoo": "^0.0.0" } }\n');

	const targetDir = scaffoldPluginSurface(packageRoot, root, 'builtin.audit-promptfoo-security');

	assert.equal(targetDir, join(root, 'collector', 'plugins', 'builtin.audit-promptfoo-security'));
	assert.equal(
		readFileSync(join(targetDir, 'package.json'), 'utf-8'),
		'{ "dependencies": { "promptfoo": "^0.0.0" } }\n',
	);
});

test('scaffoldPluginSurface rejects existing target', () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-setup-existing-'));
	const packageRoot = mkdtempSync(join(tmpdir(), 'harbor-pkg-existing-'));
	const templateDir = join(packageRoot, 'templates', 'setup', 'example-user-defined-plugin');
	const targetDir = join(root, 'collector', 'plugins', 'example-user-defined-plugin');
	mkdirSync(templateDir, { recursive: true });
	mkdirSync(targetDir, { recursive: true });

	assert.throws(() => scaffoldPluginSurface(packageRoot, root, 'example-user-defined-plugin'), /Target already exists/);
});

test('setup template registry exposes supported plugin templates', () => {
	assert.deepEqual(listSetupTemplateIds(), [
		'builtin.audit-promptfoo-security',
		'builtin.audit-skill-scanner',
		'example-user-defined-plugin',
	]);
	assert.equal(
		getSetupTemplate('builtin.audit-promptfoo-security')?.generatedLabel,
		'promptfoo security plugin manifest',
	);
	assert.equal(
		getSetupTemplate('builtin.audit-skill-scanner')?.generatedLabel,
		'skill-scanner plugin requirements file',
	);
});
