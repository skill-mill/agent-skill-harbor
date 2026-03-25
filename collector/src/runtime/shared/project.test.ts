import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { getProjectRoot, parseGitHubRemoteUrl } from './project.js';

test('parseGitHubRemoteUrl parses ssh remotes', () => {
	assert.deepEqual(parseGitHubRemoteUrl('git@github.com:example/agent-skill-harbor.git'), {
		org: 'example',
		repo: 'agent-skill-harbor',
	});
});

test('parseGitHubRemoteUrl parses https remotes', () => {
	assert.deepEqual(parseGitHubRemoteUrl('https://github.com/example/agent-skill-harbor.git'), {
		org: 'example',
		repo: 'agent-skill-harbor',
	});
});

test('getProjectRoot resolves relative SKILL_HARBOR_PROJECT_ROOT values', () => {
	const originalProjectRoot = process.env.SKILL_HARBOR_PROJECT_ROOT;
	const originalCwd = process.cwd();
	process.chdir('/tmp');
	const expectedRoot = resolve(process.cwd(), '../example-project');
	process.env.SKILL_HARBOR_PROJECT_ROOT = '../example-project';

	try {
		assert.equal(getProjectRoot(), expectedRoot);
	} finally {
		process.chdir(originalCwd);
		if (originalProjectRoot === undefined) delete process.env.SKILL_HARBOR_PROJECT_ROOT;
		else process.env.SKILL_HARBOR_PROJECT_ROOT = originalProjectRoot;
	}
});
