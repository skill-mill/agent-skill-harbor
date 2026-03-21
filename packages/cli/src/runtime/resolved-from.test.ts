import assert from 'node:assert/strict';
import test from 'node:test';
import {
	normalizeResolvedFromFrontmatter,
	normalizeResolvedFromSkillsLock,
	parseProjectSkillsLock,
	resolveSkillLookupName,
} from './resolved-from.js';

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
