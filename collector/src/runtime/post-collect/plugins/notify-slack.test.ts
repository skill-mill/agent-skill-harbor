import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { dump as yamlDump } from 'js-yaml';
import { notifySlackPlugin } from './notify-slack.js';

test('notify-slack uses warn and danger as default highlighted intents', async () => {
	const root = mkdtempSync(join(tmpdir(), 'notify-slack-default-'));
	mkdirSync(join(root, 'data', 'plugins'), { recursive: true });
	writeFileSync(
		join(root, 'data', 'collects.yaml'),
		yamlDump([
			{
				collect_id: 'collect-1',
				collecting: { collected_at: '2026-03-25T00:00:00Z', duration_sec: 1 },
				statistics: {
					org: { repos: 1, repos_with_skills: 1, skills: 1, files: 1 },
					community: { repos: 0, repos_with_skills: 0, skills: 0, files: 0 },
				},
			},
		]),
	);
	writeFileSync(
		join(root, 'data', 'plugins', 'builtin.audit-skill-scanner.yaml'),
		yamlDump([
			{
				collect_id: 'collect-1',
				summary: 'scanner summary',
				label_intents: { LOW: 'warn', CRITICAL: 'danger' },
				results: {
					'a': { label: 'LOW' },
					'b': { label: 'CRITICAL' },
				},
			},
		]),
	);

	const logs: string[] = [];
	const originalLog = console.log;
	console.log = (...args: unknown[]) => {
		logs.push(args.map((arg) => String(arg)).join(' '));
	};

	try {
		const result = await notifySlackPlugin.run({
			schema_version: 1,
			plugin_id: 'builtin.notify-slack',
			project_root: root,
			collect_id: 'collect-1',
			paths: {
				data_dir: join(root, 'data'),
				catalog_yaml: join(root, 'data', 'skills.yaml'),
				skills_dir: join(root, 'data', 'skills'),
				collects_yaml: join(root, 'data', 'collects.yaml'),
			},
			catalog: { repositories: {} },
			plugin_config: { disable_send: true },
		});

		assert.equal(result.summary, 'Prepared Slack notification with 1 plugin summary section(s) and 1 highlighted section(s).');
		assert.match(logs.join('\n'), /builtin\.audit-skill-scanner: LOW: 1, CRITICAL: 1/);
	} finally {
		console.log = originalLog;
	}
});

test('notify-slack debug message clearly includes DEBUG text', async () => {
	const root = mkdtempSync(join(tmpdir(), 'notify-slack-debug-'));
	mkdirSync(join(root, 'data'), { recursive: true });

	const logs: string[] = [];
	const originalLog = console.log;
	console.log = (...args: unknown[]) => {
		logs.push(args.map((arg) => String(arg)).join(' '));
	};

	try {
		await notifySlackPlugin.run({
			schema_version: 1,
			plugin_id: 'builtin.notify-slack',
			project_root: root,
			collect_id: 'collect-debug',
			paths: {
				data_dir: join(root, 'data'),
				catalog_yaml: join(root, 'data', 'skills.yaml'),
				skills_dir: join(root, 'data', 'skills'),
				collects_yaml: join(root, 'data', 'collects.yaml'),
			},
			catalog: { repositories: {} },
			plugin_config: { disable_send: true, use_debug_message: true },
		});
		assert.match(logs.join('\n'), /DEBUG notify-slack message for collect collect-debug/);
	} finally {
		console.log = originalLog;
	}
});
