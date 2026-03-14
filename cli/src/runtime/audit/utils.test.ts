import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_ENGINE_TIMEOUT_SEC, MAX_ENGINE_TIMEOUT_SEC } from './types.js';
import { loadAuditSettings, resolveAuditEngines } from './utils.js';

test('loadAuditSettings preserves an explicit empty engine list', () => {
	const root = mkdtempSync(join(tmpdir(), 'audit-settings-'));
	const configDir = join(root, 'config');
	mkdirSync(configDir, { recursive: true });
	writeFileSync(
		join(configDir, 'harbor.yaml'),
		['audit:', '  fail_on: fail', '  exclude_community_repos: true', '  engines: []', ''].join('\n'),
	);

	const settings = loadAuditSettings(root);
	assert.deepEqual(settings.engines, []);
	assert.deepEqual(resolveAuditEngines(settings), []);
});

test('resolveAuditEngines applies the default timeout to user-defined engines', () => {
	const settings = {
		fail_on: 'fail' as const,
		exclude_community_repos: true,
		engines: [{ id: 'company-policy', command: ['python3', 'scripts/audit.py'] }],
	};

	const resolved = resolveAuditEngines(settings);
	assert.equal(resolved[0].timeout_sec, DEFAULT_ENGINE_TIMEOUT_SEC);
});

test('resolveAuditEngines rejects timeout values above the maximum', () => {
	const settings = {
		fail_on: 'fail' as const,
		exclude_community_repos: true,
		engines: [
			{
				id: 'company-policy',
				command: ['python3', 'scripts/audit.py'],
				timeout_sec: MAX_ENGINE_TIMEOUT_SEC + 1,
			},
		],
	};

	assert.throws(() => resolveAuditEngines(settings), /timeout_sec must be <=/);
});
