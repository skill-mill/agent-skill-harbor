import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { detectEnabledPluginManifests } from './enabled-plugin-manifests.js';

test('detectEnabledPluginManifests returns enabled ids and python presence', () => {
	const root = mkdtempSync(join(tmpdir(), 'enabled-plugin-manifests-'));
	mkdirSync(join(root, 'config'), { recursive: true });
	mkdirSync(join(root, 'collector', 'plugins', 'builtin.audit-skill-scanner'), { recursive: true });
	writeFileSync(
		join(root, 'config', 'harbor.yaml'),
		[
			'post_collect:',
			'  plugins:',
			'    - id: builtin.detect-drift',
			'    - id: builtin.audit-skill-scanner',
			'',
		].join('\n'),
	);
	writeFileSync(join(root, 'collector', 'plugins', 'builtin.audit-skill-scanner', 'requirements.txt'), 'example==1.0.0\n');

	const result = detectEnabledPluginManifests(root);
	assert.deepEqual(result.enabledPluginIds, ['builtin.detect-drift', 'builtin.audit-skill-scanner']);
	assert.equal(result.hasPython, true);
});
