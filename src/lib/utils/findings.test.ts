import assert from 'node:assert/strict';
import test from 'node:test';
import type { FindingEntry, FlatSkillEntry } from '$lib/types';
import { filterFindings, matchesFindingQuery } from './findings.js';

const baseSkill: FlatSkillEntry = {
	key: 'github.com/acme/foo/skills/test/SKILL.md',
	repoKey: 'github.com/acme/foo',
	skillPath: 'skills/test/SKILL.md',
	platform: 'github.com',
	owner: 'acme',
	repo: 'foo',
	visibility: 'internal',
	isOrgOwned: true,
	frontmatter: {
		name: 'Test Skill',
		description: 'Validates documents and catches regressions.',
	},
	files: ['skills/test/SKILL.md'],
	excerpt: 'Validates documents and catches regressions.',
	usage_policy: 'recommended',
	tree_sha: null,
};

const findings: FindingEntry[] = [
	{
		skill: baseSkill,
		plugin_id: 'builtin.detect-drift',
		plugin_short_label: 'Drift',
		label: 'Drifted',
		intent: 'danger',
		raw: 'The generated output has drifted from the expected baseline.',
	},
	{
		skill: {
			...baseSkill,
			key: 'github.com/community/bar/skills/other/SKILL.md',
			repoKey: 'github.com/community/bar',
			skillPath: 'skills/other/SKILL.md',
			owner: 'community',
			repo: 'bar',
			visibility: 'public',
			isOrgOwned: false,
			usage_policy: 'none',
			frontmatter: {
				name: 'Other Skill',
				description: 'Useful helper skill.',
			},
		},
		plugin_id: 'builtin.audit-skill-scanner',
		plugin_short_label: 'Scanner',
		label: 'Risky',
		intent: 'danger',
		summary: 'Skill scanner detected risky instructions.',
	},
];

test('filterFindings applies parent skill filters and finding plugin filters', () => {
	const result = filterFindings(findings, {
		status: 'recommended',
		visibility: 'internal',
		orgOwnership: 'org',
		hasOrigin: null,
		pluginLabels: { 'builtin.detect-drift': 'Drifted' },
	});

	assert.equal(result.length, 1);
	assert.equal(result[0]?.plugin_id, 'builtin.detect-drift');
});

test('filterFindings ignores plugin label filters for other plugins', () => {
	const result = filterFindings(findings, {
		status: null,
		visibility: null,
		orgOwnership: null,
		hasOrigin: null,
		pluginLabels: {
			'builtin.detect-drift': 'Drifted',
			'builtin.audit-skill-scanner': 'Risky',
		},
	});

	assert.equal(result.length, 2);
	assert.deepEqual(result.map((finding) => finding.plugin_id).sort(), [
		'builtin.audit-skill-scanner',
		'builtin.detect-drift',
	]);
});

test('matchesFindingQuery matches skill fields and plugin fields', () => {
	assert.equal(matchesFindingQuery(findings[0], 'test skill'), true);
	assert.equal(matchesFindingQuery(findings[0], 'drift'), true);
	assert.equal(matchesFindingQuery(findings[1], 'scanner'), true);
	assert.equal(matchesFindingQuery(findings[1], 'does-not-exist'), false);
});
