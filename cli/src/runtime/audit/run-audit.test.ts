import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dump as yamlDump } from 'js-yaml';
import { runAudit } from './run-audit.js';

function writeSkill(root: string, repoKey: string, skillPath: string, content: string, treeSha: string): string {
	const skillFile = join(root, 'data', 'skills', repoKey, skillPath);
	mkdirSync(join(skillFile, '..'), { recursive: true });
	writeFileSync(skillFile, content);
	return treeSha;
}

test('runAudit reports processed and skipped counts by ownership bucket', () => {
	const root = mkdtempSync(join(tmpdir(), 'run-audit-'));
	const previousRoot = process.env.SKILL_HARBOR_ROOT;
	const previousOrg = process.env.GH_ORG;
	process.env.SKILL_HARBOR_ROOT = root;
	process.env.GH_ORG = 'example-org';

	try {
		mkdirSync(join(root, 'config'), { recursive: true });
		mkdirSync(join(root, 'data'), { recursive: true });

		writeFileSync(
			join(root, 'config', 'harbor.yaml'),
			['audit:', '  exclude_community_repos: false', '  engines:', '    - id: static', ''].join('\n'),
		);

		const repositories = {
			'github.com/example-org/internal-tools': {
				visibility: 'private',
				skills: {
					'skills/safe/SKILL.md': {
						tree_sha: writeSkill(
							root,
							'github.com/example-org/internal-tools',
							'skills/safe/SKILL.md',
							'# Safe\n',
							'sha-safe',
						),
					},
					'skills/risky/SKILL.md': {
						tree_sha: writeSkill(
							root,
							'github.com/example-org/internal-tools',
							'skills/risky/SKILL.md',
							'# Risky\nRun `sudo rm -rf /tmp/demo`\n',
							'sha-risky',
						),
					},
				},
			},
			'github.com/community/tools': {
				visibility: 'public',
				skills: {
					'skills/community/SKILL.md': {
						tree_sha: writeSkill(
							root,
							'github.com/community/tools',
							'skills/community/SKILL.md',
							'# Community\n',
							'sha-community',
						),
					},
				},
			},
		};

		writeFileSync(join(root, 'data', 'skills.yaml'), yamlDump({ repositories }));
		writeFileSync(
			join(root, 'data', 'report.yaml'),
			yamlDump({
				results: {
					'github.com/community/tools/skills/community/SKILL.md': {
						tree_sha: 'sha-community',
						engines: {
							static: {
								result: 'warn',
								summary: 'existing result',
							},
						},
					},
				},
			}),
		);

		const summary = runAudit({
			projectRoot: root,
			log: false,
		});

		assert.equal(summary.processed, 2);
		assert.equal(summary.skipped, 1);
		assert.equal(summary.report?.org.processed.pass, 1);
		assert.equal(summary.report?.org.processed.info, 1);
		assert.equal(summary.report?.community.skipped.warn, 1);
	} finally {
		if (previousRoot === undefined) delete process.env.SKILL_HARBOR_ROOT;
		else process.env.SKILL_HARBOR_ROOT = previousRoot;

		if (previousOrg === undefined) delete process.env.GH_ORG;
		else process.env.GH_ORG = previousOrg;
	}
});
