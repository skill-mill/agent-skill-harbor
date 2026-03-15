import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeCatalogForSave } from './collect-org-skills.js';

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
							frontmatter: {
								name: 'tools',
								description: 'should not be saved',
							},
						} as {
							tree_sha: string;
							updated_at: string;
							registered_at: string;
							resolved_from: string;
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
						},
					},
				},
			},
		},
	);
});
