import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { runPostCollect } from './run-post-collect.js';

function writeSkill(root: string, repoKey: string, skillPath: string, content: string): void {
	const fullPath = join(root, 'data', 'skills', repoKey, skillPath);
	mkdirSync(join(fullPath, '..'), { recursive: true });
	writeFileSync(fullPath, content);
}

test('runPostCollect saves detect-drift output', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-'));
	mkdirSync(join(root, 'data'), { recursive: true });

	const catalog = {
		repositories: {
			'github.com/example/copy': {
				visibility: 'public',
				skills: {
					'skills/tooling/SKILL.md': {
						tree_sha: 'copy-tree',
						resolved_from: 'github.com/example/origin@abc123',
					},
				},
			},
			'github.com/example/origin': {
				visibility: 'public',
				skills: {
					'upstream/tooling/SKILL.md': {
						tree_sha: 'abc123456789',
					},
				},
			},
		},
	};

	writeFileSync(join(root, 'data', 'skills.yaml'), yamlDump(catalog));
	writeSkill(root, 'github.com/example/copy', 'skills/tooling/SKILL.md', '---\nname: tooling\n---\ncopy');
	writeSkill(root, 'github.com/example/origin', 'upstream/tooling/SKILL.md', '---\nname: tooling\n---\norigin');

	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-1',
		catalog,
		log: false,
		plugins: [{ id: 'builtin.detect-drift' }],
	});

	const output = yamlLoad(
		readFileSync(join(root, 'data', 'plugins', 'builtin.detect-drift.yaml'), 'utf-8'),
	) as {
		collect_id?: string;
		results: Record<string, { label?: string }>;
	}[];
	assert.equal(output[0].collect_id, 'collect-1');
	assert.equal(output[0].results['github.com/example/copy/skills/tooling/SKILL.md']?.label, 'In sync');
});

test('runPostCollect loads local ts plugin with tsx', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-ts-'));
	mkdirSync(join(root, 'plugins', 'sample_plugin'), { recursive: true });
	mkdirSync(join(root, 'data'), { recursive: true });

	writeFileSync(
		join(root, 'plugins', 'sample_plugin', 'index.ts'),
		[
			"export async function run(context) {",
			"  return {",
			"    summary: `checked ${Object.keys(context.catalog.repositories).length} repo(s)`,",
			"    results: {",
			"      'github.com/example/demo/tools/SKILL.md': { label: 'Reviewed', raw: 'plugin ok' }",
			'    }',
			'  };',
			'}',
			'',
		].join('\n'),
	);

	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-2',
		catalog: {
			repositories: {
				'github.com/example/demo': {
					visibility: 'public',
					skills: {
						'tools/SKILL.md': {
							tree_sha: 'tree',
						},
					},
				},
			},
		},
		log: false,
		plugins: [{ id: 'sample_plugin' }],
	});

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'sample_plugin.yaml'), 'utf-8')) as {
		summary?: string;
		results?: Record<string, { label?: string; raw?: string }>;
	}[];
	assert.equal(output[0].summary, 'checked 1 repo(s)');
	assert.deepEqual(output[0].results?.['github.com/example/demo/tools/SKILL.md'], {
		label: 'Reviewed',
		raw: 'plugin ok',
	});
});

test('runPostCollect prefers mjs over js and ts for local plugins', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-order-'));
	mkdirSync(join(root, 'plugins', 'sample_plugin'), { recursive: true });
	mkdirSync(join(root, 'data'), { recursive: true });

	writeFileSync(
		join(root, 'plugins', 'sample_plugin', 'index.ts'),
		[
			"export async function run() {",
			"  return { results: { 'skill': { label: 'ts' } } };",
			'}',
			'',
		].join('\n'),
	);
	writeFileSync(
		join(root, 'plugins', 'sample_plugin', 'index.js'),
		[
			'export async function run() {',
			"  return { results: { 'skill': { label: 'js' } } };",
			'}',
			'',
		].join('\n'),
	);
	writeFileSync(
		join(root, 'plugins', 'sample_plugin', 'index.mjs'),
		[
			'export async function run() {',
			"  return { results: { 'skill': { label: 'mjs' } } };",
			'}',
			'',
		].join('\n'),
	);

	await runPostCollect({
		projectRoot: root,
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'sample_plugin' }],
	});

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'sample_plugin.yaml'), 'utf-8')) as {
		results?: Record<string, { label?: string }>;
	}[];
	assert.equal(output[0].results?.skill?.label, 'mjs');
});

test('runPostCollect replaces same collect_id and respects history limit', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-history-'));
	mkdirSync(join(root, 'plugins', 'sample_plugin'), { recursive: true });
	mkdirSync(join(root, 'config'), { recursive: true });
	mkdirSync(join(root, 'data'), { recursive: true });

	writeFileSync(join(root, 'config', 'harbor.yaml'), 'collector:\n  history_limit: 2\n');
	writeFileSync(
		join(root, 'plugins', 'sample_plugin', 'index.ts'),
		[
			'let count = 0;',
			'export async function run() {',
			'  count += 1;',
			"  return { results: { skill: { label: `run-${count}` } } };",
			'}',
			'',
		].join('\n'),
	);

	await runPostCollect({ projectRoot: root, collectId: 'collect-1', catalog: { repositories: {} }, log: false, plugins: [{ id: 'sample_plugin' }] });
	await runPostCollect({ projectRoot: root, collectId: 'collect-1', catalog: { repositories: {} }, log: false, plugins: [{ id: 'sample_plugin' }] });
	await runPostCollect({ projectRoot: root, collectId: 'collect-2', catalog: { repositories: {} }, log: false, plugins: [{ id: 'sample_plugin' }] });
	await runPostCollect({ projectRoot: root, collectId: 'collect-3', catalog: { repositories: {} }, log: false, plugins: [{ id: 'sample_plugin' }] });

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'sample_plugin.yaml'), 'utf-8')) as {
		collect_id?: string;
		results?: Record<string, { label?: string }>;
	}[];
	assert.deepEqual(
		output.map((entry) => entry.collect_id),
		['collect-3', 'collect-2'],
	);
	assert.equal(output[0].results?.skill?.label, 'run-4');
});

test('runPostCollect rejects invalid user plugin ids', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-invalid-id-'));
	mkdirSync(join(root, 'data'), { recursive: true });

	await assert.rejects(
		runPostCollect({
			projectRoot: root,
			catalog: { repositories: {} },
			log: false,
			plugins: [{ id: 'plugin.sample' }],
		}),
		/Invalid user plugin id "plugin\.sample"/,
	);
});

test('runPostCollect logs plugin start, built-in summary and saved path', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-log-'));
	mkdirSync(join(root, 'data'), { recursive: true });

	const logs: string[] = [];
	const originalLog = console.log;
	console.log = (...args: unknown[]) => {
		logs.push(args.map((arg) => String(arg)).join(' '));
	};

	try {
		await runPostCollect({
			projectRoot: root,
			collectId: 'collect-log',
			catalog: { repositories: {} },
			log: true,
			plugins: [{ id: 'builtin.detect-drift' }],
		});
	} finally {
		console.log = originalLog;
	}

	assert.match(logs.join('\n'), /builtin\.detect-drift \(start\)/);
	assert.match(logs.join('\n'), /detect-drift: scanning collected skills for origin drift/);
	assert.match(logs.join('\n'), /detect-drift: checked 0 skill\(s\) \(0 in sync, 0 drifted, 0 unknown\)/);
	assert.match(logs.join('\n'), /builtin\.detect-drift \(done\)/);
	assert.match(logs.join('\n'), /saved: .*builtin\.detect-drift\.yaml/);
});

test('runPostCollect passes built-in config and stores unknown result when promptfoo model is missing', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-promptfoo-'));
	mkdirSync(join(root, 'data'), { recursive: true });
	writeSkill(root, 'github.com/example/demo', 'skills/example/SKILL.md', '# example');

	const catalog = {
		repositories: {
			'github.com/example/demo': {
				visibility: 'public',
				skills: {
					'skills/example/SKILL.md': {
						tree_sha: 'tree',
					},
				},
			},
		},
	};

	const previousOrg = process.env.GH_ORG;
	process.env.GH_ORG = 'unused-in-test';
	try {
		await runPostCollect({
			projectRoot: root,
			collectId: 'collect-security',
			orgName: 'example',
			catalog,
			log: false,
			plugins: [{ id: 'builtin.audit-promptfoo-security', config: {} }],
		});
	} finally {
		if (previousOrg === undefined) {
			delete process.env.GH_ORG;
		} else {
			process.env.GH_ORG = previousOrg;
		}
	}

	const output = yamlLoad(
		readFileSync(join(root, 'data', 'plugins', 'builtin.audit-promptfoo-security.yaml'), 'utf-8'),
	) as {
		sub_artifacts?: string[];
		results?: Record<string, { label?: string; raw?: string }>;
	}[];
	assert.deepEqual(output[0].sub_artifacts, ['report.html']);
	assert.equal(output[0].results?.['github.com/example/demo/skills/example/SKILL.md']?.label, 'Unknown');
	assert.match(output[0].results?.['github.com/example/demo/skills/example/SKILL.md']?.raw ?? '', /model is not configured/i);
});

test('runPostCollect runs skill-scanner for org-owned skills and stores sub artifacts', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-skill-scanner-'));
	mkdirSync(join(root, 'data'), { recursive: true });
	writeSkill(root, 'github.com/example/demo', 'skills/example/SKILL.md', '# example');
	writeSkill(root, 'github.com/community/demo', 'skills/other/SKILL.md', '# other');

	const commandPath = join(root, 'mock-skill-scanner.mjs');
	writeFileSync(
		commandPath,
		[
			'#!/usr/bin/env node',
			"import { mkdirSync, writeFileSync } from 'node:fs';",
			"import { dirname } from 'node:path';",
			'const args = process.argv.slice(2);',
			"if (args[0] === '--version') { console.log('skill-scanner 2.0.4'); process.exit(0); }",
			"if (args[0] !== 'scan') process.exit(1);",
			'const readArg = (flag) => {',
			'  const index = args.indexOf(flag);',
			'  return index >= 0 ? args[index + 1] : null;',
			'};',
			"for (const filePath of [readArg('--output'), readArg('--output-html'), readArg('--output-sarif'), readArg('--output-json')]) {",
			'  if (!filePath) continue;',
			'  mkdirSync(dirname(filePath), { recursive: true });',
			"}",
			"writeFileSync(readArg('--output'), 'summary');",
			"writeFileSync(readArg('--output-html'), '<html><body>ok</body></html>');",
			"writeFileSync(readArg('--output-sarif'), JSON.stringify({ version: '2.1.0', runs: [] }));",
			"writeFileSync(readArg('--output-json'), JSON.stringify({ is_safe: false, max_severity: 'LOW', findings_count: 2 }));",
		].join('\n'),
	);
	chmodSync(commandPath, 0o755);

	const catalog = {
		repositories: {
			'github.com/example/demo': {
				visibility: 'public',
				skills: {
					'skills/example/SKILL.md': {
						tree_sha: 'tree',
					},
				},
			},
			'github.com/community/demo': {
				visibility: 'public',
				skills: {
					'skills/other/SKILL.md': {
						tree_sha: 'tree',
					},
				},
			},
		},
	};

	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-skill-scanner',
		orgName: 'example',
		catalog,
		log: false,
		plugins: [{ id: 'builtin.audit-skill-scanner', config: { command: commandPath, options: '--policy strict' } }],
	});

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'builtin.audit-skill-scanner.yaml'), 'utf-8')) as {
		sub_artifacts?: string[];
		results?: Record<string, { label?: string; raw?: string; findings_count?: number; is_safe?: boolean }>;
	}[];
	assert.deepEqual(output[0].sub_artifacts, ['report.html', 'report.sarif.json', 'report.json']);
	assert.deepEqual(output[0].results?.['github.com/example/demo/skills/example/SKILL.md'], {
		label: 'LOW',
		raw: '2 findings, max severity LOW (scanner safe=false)',
		findings_count: 2,
		max_severity: 'LOW',
		is_safe: false,
	});
	assert.equal(output[0].results?.['github.com/community/demo/skills/other/SKILL.md'], undefined);
});

test('runPostCollect fails when skill-scanner CLI is unavailable', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-skill-scanner-missing-'));
	mkdirSync(join(root, 'data'), { recursive: true });
	writeSkill(root, 'github.com/example/demo', 'skills/example/SKILL.md', '# example');

	await assert.rejects(
		runPostCollect({
			projectRoot: root,
			collectId: 'collect-skill-scanner-missing',
			orgName: 'example',
			catalog: {
				repositories: {
					'github.com/example/demo': {
						visibility: 'public',
						skills: {
							'skills/example/SKILL.md': {
								tree_sha: 'tree',
							},
						},
					},
				},
			},
			log: false,
			plugins: [{ id: 'builtin.audit-skill-scanner', config: { command: 'definitely-missing-skill-scanner' } }],
		}),
		/skill-scanner CLI is unavailable/i,
	);
});
