import assert from 'node:assert/strict';
import test from 'node:test';
import { collectFromResolvedFrom, sanitizeCatalogForSave, updateDriftStatus } from './collect-org-skills.js';

test('sanitizeCatalogForSave strips copied frontmatter from skills.yaml entries', () => {
	assert.deepEqual(
		sanitizeCatalogForSave({
			repositories: {
				'github.com/example/demo': {
					visibility: 'public',
					repo_sha: 'repo-sha',
					fork: true,
					skills: {
						'tools/SKILL.md': {
							tree_sha: 'tree-sha',
							updated_at: '2026-03-16T00:00:00.000Z',
							registered_at: '2026-03-15T00:00:00.000Z',
							resolved_from: 'github.com/example/origin@abc123',
							drift_status: 'in_sync',
							frontmatter: {
								name: 'tools',
								description: 'should not be saved',
							},
						} as {
							tree_sha: string;
							updated_at: string;
							registered_at: string;
							resolved_from: string;
							drift_status: 'drifted' | 'in_sync' | 'unknown';
							frontmatter: Record<string, unknown>;
						},
					},
				},
			},
		}),
		{
			repositories: {
				'github.com/example/demo': {
					visibility: 'public',
					repo_sha: 'repo-sha',
					fork: true,
					skills: {
						'tools/SKILL.md': {
							tree_sha: 'tree-sha',
							updated_at: '2026-03-16T00:00:00.000Z',
							registered_at: '2026-03-15T00:00:00.000Z',
							resolved_from: 'github.com/example/origin@abc123',
							drift_status: 'in_sync',
						},
					},
				},
			},
		},
	);
});

test('updateDriftStatus marks matching origin tree as in_sync', () => {
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

	updateDriftStatus(catalog, (repoKey, skillPath) => {
		if (repoKey === 'github.com/example/copy' && skillPath === 'skills/tooling/SKILL.md') {
			return { name: 'tooling' };
		}
		if (repoKey === 'github.com/example/origin' && skillPath === 'upstream/tooling/SKILL.md') {
			return { name: 'tooling' };
		}
		return {};
	});

	assert.equal(
		(catalog.repositories['github.com/example/copy'].skills['skills/tooling/SKILL.md'] as { drift_status?: string })
			.drift_status,
		'in_sync',
	);
});

test('updateDriftStatus marks mismatched origin tree as drifted', () => {
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
						tree_sha: 'fff999456789',
					},
				},
			},
		},
	};

	updateDriftStatus(catalog, () => ({ name: 'tooling' }));

	assert.equal(
		(catalog.repositories['github.com/example/copy'].skills['skills/tooling/SKILL.md'] as { drift_status?: string })
			.drift_status,
		'drifted',
	);
});

test('updateDriftStatus marks missing origin sha as unknown', () => {
	const catalog = {
		repositories: {
			'github.com/example/copy': {
				visibility: 'public',
				skills: {
					'skills/tooling/SKILL.md': {
						tree_sha: 'copy-tree',
						resolved_from: 'github.com/example/origin',
					},
				},
			},
		},
	};

	updateDriftStatus(catalog, () => ({ name: 'tooling' }));

	assert.equal(
		(catalog.repositories['github.com/example/copy'].skills['skills/tooling/SKILL.md'] as { drift_status?: string })
			.drift_status,
		'unknown',
	);
});

test('updateDriftStatus clears drift_status when resolved_from is absent', () => {
	const catalog = {
		repositories: {
			'github.com/example/copy': {
				visibility: 'public',
				skills: {
					'skills/tooling/SKILL.md': {
						tree_sha: 'copy-tree',
						drift_status: 'unknown' as const,
					},
				},
			},
		},
	};

	updateDriftStatus(catalog, () => ({ name: 'tooling' }));

	assert.equal(
		'drift_status' in catalog.repositories['github.com/example/copy'].skills['skills/tooling/SKILL.md'],
		false,
	);
});

test('collectFromResolvedFrom queues lock-derived origin repos', () => {
	const queuedRepoKeys = new Set<string>();
	const refs = collectFromResolvedFrom(
		'github.com',
		'github.com/example/origin',
		new Set<string>(),
		queuedRepoKeys,
	);

	assert.deepEqual(refs, [
		{
			owner: 'example',
			repo: 'origin',
			repoKey: 'github.com/example/origin',
			sha: null,
		},
	]);
	assert.equal(queuedRepoKeys.has('github.com/example/origin'), true);
});

test('collectFromResolvedFrom ignores already queued repos', () => {
	const queuedRepoKeys = new Set<string>(['github.com/example/origin']);
	const refs = collectFromResolvedFrom(
		'github.com',
		'github.com/example/origin@abc123',
		new Set<string>(),
		queuedRepoKeys,
	);

	assert.deepEqual(refs, []);
	assert.equal(queuedRepoKeys.size, 1);
});
