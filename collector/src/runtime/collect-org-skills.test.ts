import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { sanitizeCatalogForSave } from './shared/catalog-store.js';
import { collectFromResolvedFrom, runCollectOrgSkills } from './collect-org-skills.js';

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

test('collectFromResolvedFrom queues lock-derived origin repos', () => {
	const queuedRepoKeys = new Set<string>();
	const refs = collectFromResolvedFrom('github.com', 'github.com/example/origin', new Set<string>(), queuedRepoKeys);

	assert.deepEqual(refs, [
		{
			platform: 'github.com',
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

test('runCollectOrgSkills fails when config/harbor.yaml is missing', async () => {
	const root = mkdtempSync(join(tmpdir(), 'collect-missing-config-'));
	const originalProjectRoot = process.env.SKILL_HARBOR_PROJECT_ROOT;
	const originalToken = process.env.GH_TOKEN;
	const originalOrg = process.env.GH_ORG;
	const originalRepo = process.env.GH_REPO;

	process.env.SKILL_HARBOR_PROJECT_ROOT = root;
	process.env.GH_TOKEN = 'test-token';
	process.env.GH_ORG = 'example';
	process.env.GH_REPO = 'demo';

	try {
		await assert.rejects(runCollectOrgSkills(), /error: config\/harbor\.yaml not found/i);
	} finally {
		if (originalProjectRoot === undefined) delete process.env.SKILL_HARBOR_PROJECT_ROOT;
		else process.env.SKILL_HARBOR_PROJECT_ROOT = originalProjectRoot;
		if (originalToken === undefined) delete process.env.GH_TOKEN;
		else process.env.GH_TOKEN = originalToken;
		if (originalOrg === undefined) delete process.env.GH_ORG;
		else process.env.GH_ORG = originalOrg;
		if (originalRepo === undefined) delete process.env.GH_REPO;
		else process.env.GH_REPO = originalRepo;
	}
});
