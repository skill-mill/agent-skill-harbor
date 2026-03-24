import assert from 'node:assert/strict';
import test from 'node:test';
import {
	normalizeResolvedFromFrontmatter,
	normalizeResolvedFromSkillsLock,
	parseResolvedFromRef,
	parseProjectSkillsLock,
	resolveSkillLookupName,
} from './shared/resolved-from.js';

test('normalizeResolvedFromFrontmatter adds the github.com platform prefix', () => {
	assert.equal(
		normalizeResolvedFromFrontmatter('skill-mill/sk-frontend-kit@41456e9'),
		'github.com/skill-mill/sk-frontend-kit@41456e9',
	);
});

test('normalizeResolvedFromSkillsLock resolves GitHub entries without sha', () => {
	const entries = parseProjectSkillsLock(
		JSON.stringify({
			version: 1,
			skills: {
				'deploy-to-vercel': {
					source: 'vercel-labs/agent-skills',
					sourceType: 'github',
					computedHash: 'abc123',
				},
			},
		}),
	);

	assert.equal(normalizeResolvedFromSkillsLock('deploy-to-vercel', entries), 'github.com/vercel-labs/agent-skills');
});

test('normalizeResolvedFromSkillsLock ignores non-GitHub entries', () => {
	const entries = parseProjectSkillsLock(
		JSON.stringify({
			version: 1,
			skills: {
				'deploy-to-vercel': {
					source: 'https://example.com/skill',
					sourceType: 'url',
				},
			},
		}),
	);

	assert.equal(normalizeResolvedFromSkillsLock('deploy-to-vercel', entries), null);
});

test('resolveSkillLookupName falls back to the skill directory name', () => {
	assert.equal(resolveSkillLookupName({}, '.claude/skills/deploy-to-vercel/SKILL.md'), 'deploy-to-vercel');
});

test('parseResolvedFromRef parses repo key and sha from normalized refs', () => {
	assert.deepEqual(parseResolvedFromRef('github.com/example/origin@abc123'), {
		platform: 'github.com',
		owner: 'example',
		repo: 'origin',
		repoKey: 'github.com/example/origin',
		sha: 'abc123',
	});
});
