import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
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

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'builtin.detect-drift.yaml'), 'utf-8')) as {
		collect_id?: string;
		persist?: boolean;
		results: Record<string, { label?: string }>;
	}[];
	assert.equal(output[0].collect_id, 'collect-1');
	assert.equal(output[0].persist, undefined);
	assert.equal(output[0].results['github.com/example/copy/skills/tooling/SKILL.md']?.label, 'In sync');
});

test('runPostCollect loads local ts plugin with tsx', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-ts-'));
	mkdirSync(join(root, 'collector', 'plugins', 'example-user-defined-plugin'), { recursive: true });
	mkdirSync(join(root, 'data'), { recursive: true });

	writeFileSync(
		join(root, 'collector', 'plugins', 'example-user-defined-plugin', 'index.ts'),
		[
			'export async function run(context) {',
			'  return {',
			'    summary: `checked ${Object.keys(context.catalog.repositories).length} repo(s)`,',
			'    results: {',
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
		plugins: [{ id: 'example-user-defined-plugin' }],
	});

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'example-user-defined-plugin.yaml'), 'utf-8')) as {
		persist?: boolean;
		summary?: string;
		results?: Record<string, { label?: string; raw?: string }>;
	}[];
	assert.equal(output[0].persist, undefined);
	assert.equal(output[0].summary, 'checked 1 repo(s)');
	assert.deepEqual(output[0].results?.['github.com/example/demo/tools/SKILL.md'], {
		label: 'Reviewed',
		raw: 'plugin ok',
	});
});

test('runPostCollect prefers mjs over js and ts for local plugins', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-order-'));
	mkdirSync(join(root, 'collector', 'plugins', 'example-user-defined-plugin'), { recursive: true });
	mkdirSync(join(root, 'data'), { recursive: true });

	writeFileSync(
		join(root, 'collector', 'plugins', 'example-user-defined-plugin', 'index.ts'),
		['export async function run() {', "  return { results: { 'skill': { label: 'ts' } } };", '}', ''].join('\n'),
	);
	writeFileSync(
		join(root, 'collector', 'plugins', 'example-user-defined-plugin', 'index.js'),
		['export async function run() {', "  return { results: { 'skill': { label: 'js' } } };", '}', ''].join('\n'),
	);
	writeFileSync(
		join(root, 'collector', 'plugins', 'example-user-defined-plugin', 'index.mjs'),
		['export async function run() {', "  return { results: { 'skill': { label: 'mjs' } } };", '}', ''].join('\n'),
	);

	await runPostCollect({
		projectRoot: root,
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'example-user-defined-plugin' }],
	});

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'example-user-defined-plugin.yaml'), 'utf-8')) as {
		results?: Record<string, { label?: string }>;
	}[];
	assert.equal(output[0].results?.skill?.label, 'mjs');
});

test('runPostCollect resolves dependencies from plugin-local node_modules', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-plugin-node-modules-'));
	const pluginDir = join(root, 'collector', 'plugins', 'notify-slack');
	const jsYamlDir = join(pluginDir, 'node_modules', 'js-yaml');
	mkdirSync(jsYamlDir, { recursive: true });
	mkdirSync(join(root, 'data'), { recursive: true });

	writeFileSync(
		join(pluginDir, 'index.ts'),
		[
			"import { load } from 'js-yaml';",
			'export async function run() {',
			"  const parsed = load('message: plugin-local dependency');",
			'  return { summary: parsed.message };',
			'}',
			'',
		].join('\n'),
	);
	writeFileSync(
		join(jsYamlDir, 'package.json'),
		JSON.stringify(
			{
				name: 'js-yaml',
				type: 'module',
				exports: './index.js',
			},
			null,
			2,
		),
	);
	writeFileSync(
		join(jsYamlDir, 'index.js'),
		[
			'export function load(source) {',
			"  const [key, value] = String(source).split(':');",
			'  return { [key.trim()]: value.trim() };',
			'}',
			'',
		].join('\n'),
	);

	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-plugin-deps',
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'notify-slack' }],
	});

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'notify-slack.yaml'), 'utf-8')) as {
		summary?: string;
	}[];
	assert.equal(output[0].summary, 'plugin-local dependency');
});

test('runPostCollect skips saving builtin notify-slack output because persist is false', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-no-persist-'));
	mkdirSync(join(root, 'data'), { recursive: true });
	mkdirSync(join(root, 'config'), { recursive: true });
	writeFileSync(
		join(root, 'config', 'harbor.yaml'),
		[
			'post_collect:',
			'  plugins:',
			'    - id: builtin.notify-slack',
			'      config:',
			'        disable_send: true',
			'        use_debug_message: true',
			'',
		].join('\n'),
	);

	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-no-persist',
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'builtin.notify-slack', config: { disable_send: true, use_debug_message: true } }],
	});

	assert.equal(existsSync(join(root, 'data', 'plugins', 'builtin.notify-slack.yaml')), false);
});

test('runPostCollect replaces same collect_id and respects history limit', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-history-'));
	mkdirSync(join(root, 'collector', 'plugins', 'example-user-defined-plugin'), { recursive: true });
	mkdirSync(join(root, 'config'), { recursive: true });
	mkdirSync(join(root, 'data'), { recursive: true });

	writeFileSync(join(root, 'config', 'harbor.yaml'), 'collector:\n  history_limit: 2\n');
	writeFileSync(
		join(root, 'collector', 'plugins', 'example-user-defined-plugin', 'index.ts'),
		[
			'let count = 0;',
			'export async function run() {',
			'  count += 1;',
			'  return { results: { skill: { label: `run-${count}` } } };',
			'}',
			'',
		].join('\n'),
	);

	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-1',
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'example-user-defined-plugin' }],
	});
	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-1',
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'example-user-defined-plugin' }],
	});
	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-2',
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'example-user-defined-plugin' }],
	});
	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-3',
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'example-user-defined-plugin' }],
	});

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'example-user-defined-plugin.yaml'), 'utf-8')) as {
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
	assert.match(logs.join('\n'), /summary: 0 skill\(s\) checked for drift\./);
	assert.match(logs.join('\n'), /saved: .*builtin\.detect-drift\.yaml/);
});

test('runPostCollect logs summary even when persist is false', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-no-persist-log-'));
	mkdirSync(join(root, 'data'), { recursive: true });
	mkdirSync(join(root, 'config'), { recursive: true });
	writeFileSync(
		join(root, 'config', 'harbor.yaml'),
		[
			'post_collect:',
			'  plugins:',
			'    - id: builtin.notify-slack',
			'      config:',
			'        disable_send: true',
			'        use_debug_message: true',
			'',
		].join('\n'),
	);

	const logs: string[] = [];
	const originalLog = console.log;
	console.log = (...args: unknown[]) => {
		logs.push(args.map((arg) => String(arg)).join(' '));
	};

	try {
		await runPostCollect({
			projectRoot: root,
			collectId: 'collect-no-persist-log',
			catalog: { repositories: {} },
			log: true,
			plugins: [{ id: 'builtin.notify-slack', config: { disable_send: true, use_debug_message: true } }],
		});
	} finally {
		console.log = originalLog;
	}

	assert.match(logs.join('\n'), /builtin\.notify-slack \(done\)/);
	assert.match(
		logs.join('\n'),
		/summary: Prepared Slack notification with 0 plugin summary section\(s\) and 0 highlighted section\(s\)\./,
	);
	assert.match(logs.join('\n'), /persist: false \(skipped saving plugin output\)/);
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
	assert.match(
		output[0].results?.['github.com/example/demo/skills/example/SKILL.md']?.raw ?? '',
		/model is not configured/i,
	);
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
			'}',
			"writeFileSync(readArg('--output'), 'summary');",
			"writeFileSync(readArg('--output-html'), '<html><body>ok</body></html>');",
			"writeFileSync(readArg('--output-sarif'), JSON.stringify({ version: '2.1.0', runs: [] }));",
			"writeFileSync(readArg('--output-json'), JSON.stringify({ is_safe: false, max_severity: 'LOW', findings_count: 2, findings: [{ description: 'First issue' }, { description: 'Second issue' }] }));",
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
		results?: Record<string, { label?: string; raw?: string; findings?: string[] }>;
	}[];
	assert.deepEqual(output[0].sub_artifacts, ['report.html', 'report.sarif.json', 'report.json']);
	assert.deepEqual(output[0].results?.['github.com/example/demo/skills/example/SKILL.md'], {
		label: 'LOW',
		raw: '2 findings, max severity LOW (scanner safe=false)',
		findings: ['First issue', 'Second issue'],
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
		/skill-scanner CLI is unavailable[\s\S]*harbor setup builtin\.audit-skill-scanner[\s\S]*requirements\.txt/i,
	);
});

test('runPostCollect normalizes invalid label intents to neutral', async () => {
	const root = mkdtempSync(join(tmpdir(), 'post-collect-intent-'));
	mkdirSync(join(root, 'collector', 'plugins', 'example-user-defined-plugin'), { recursive: true });
	mkdirSync(join(root, 'data'), { recursive: true });

	writeFileSync(
		join(root, 'collector', 'plugins', 'example-user-defined-plugin', 'index.ts'),
		[
			'export async function run() {',
			"  return { label_intents: { Custom: 'not-a-real-intent' }, results: { skill: { label: 'Custom' } } };",
			'}',
			'',
		].join('\n'),
	);

	await runPostCollect({
		projectRoot: root,
		collectId: 'collect-intent',
		catalog: { repositories: {} },
		log: false,
		plugins: [{ id: 'example-user-defined-plugin' }],
	});

	const output = yamlLoad(readFileSync(join(root, 'data', 'plugins', 'example-user-defined-plugin.yaml'), 'utf-8')) as {
		label_intents?: Record<string, string>;
	}[];
	assert.equal(output[0].label_intents?.Custom, 'neutral');
});
