import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { resolveOrgName } from './post-collect.js';

test('resolveOrgName prefers GH_ORG', () => {
	const previousOrg = process.env.GH_ORG;
	process.env.GH_ORG = 'from-env';
	try {
		assert.equal(resolveOrgName('/tmp/unused'), 'from-env');
	} finally {
		if (previousOrg === undefined) {
			delete process.env.GH_ORG;
		} else {
			process.env.GH_ORG = previousOrg;
		}
	}
});

test('resolveOrgName falls back to git remote origin', () => {
	const previousOrg = process.env.GH_ORG;
	delete process.env.GH_ORG;

	const root = mkdtempSync(join(tmpdir(), 'post-collect-org-'));
	execSync('git init', { cwd: root, stdio: 'ignore' });
	execSync('git remote add origin https://github.com/example-org/demo.git', { cwd: root, stdio: 'ignore' });

	try {
		assert.equal(resolveOrgName(root), 'example-org');
	} finally {
		if (previousOrg === undefined) {
			delete process.env.GH_ORG;
		} else {
			process.env.GH_ORG = previousOrg;
		}
	}
});
