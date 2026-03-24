import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGitHubRemoteUrl } from './project.js';

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
