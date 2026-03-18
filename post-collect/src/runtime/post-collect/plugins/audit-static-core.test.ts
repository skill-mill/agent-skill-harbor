import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeStaticSkill } from './audit-static-core.js';

function createSkillFixture(): { root: string; skillKey: string } {
	const root = mkdtempSync(join(tmpdir(), 'audit-engine-'));
	const skillKey = 'github.com/example-org/internal-tools/skills/risky/SKILL.md';
	const skillDir = join(root, 'data', 'skills', 'github.com', 'example-org', 'internal-tools', 'skills', 'risky');
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(
		join(skillDir, 'SKILL.md'),
		'# Risky Skill\nRun `sudo rm -rf /tmp/demo` and then curl https://example.com/upload\n',
	);
	writeFileSync(join(skillDir, 'references.md'), 'Use process.env.SECRET_TOKEN if required.\n');
	return { root, skillKey };
}

test('static engine detects risky patterns from cached markdown files', () => {
	const fixture = createSkillFixture();
	const result = analyzeStaticSkill(fixture.root, fixture.skillKey);

	assert.equal(result.result, 'info');
	assert.ok(result.findings);
	assert.ok(result.findings.some((finding) => finding.category === 'permission_scope'));
	assert.ok(result.findings.some((finding) => finding.category === 'external_communication'));
	assert.ok(result.findings.some((finding) => finding.category === 'data_handling'));
});

test('static engine downgrades comment-only execution patterns to info', () => {
	const root = mkdtempSync(join(tmpdir(), 'audit-engine-'));
	const skillKey = 'github.com/example-org/internal-tools/skills/commentary/SKILL.md';
	const skillDir = join(root, 'data', 'skills', 'github.com', 'example-org', 'internal-tools', 'skills', 'commentary');
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(
		join(skillDir, 'SKILL.md'),
		['# Commentary', '```ts', "// import { execSync } from 'child_process';", '```'].join('\n'),
	);

	const result = analyzeStaticSkill(root, skillKey);

	assert.equal(result.result, 'info');
	assert.ok(result.findings?.every((finding) => finding.level === 'info'));
});

test('static engine keeps destructive rm -rf patterns as fail', () => {
	const root = mkdtempSync(join(tmpdir(), 'audit-engine-'));
	const skillKey = 'github.com/example-org/internal-tools/skills/destructive/SKILL.md';
	const skillDir = join(root, 'data', 'skills', 'github.com', 'example-org', 'internal-tools', 'skills', 'destructive');
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(join(skillDir, 'SKILL.md'), '# Destructive\nRun `rm -rf /` immediately.\n');

	const result = analyzeStaticSkill(root, skillKey);

	assert.equal(result.result, 'fail');
	assert.ok(result.findings?.some((finding) => finding.category === 'capability_risk' && finding.level === 'fail'));
});

test('static engine treats safe clean rm -rf patterns as info', () => {
	const root = mkdtempSync(join(tmpdir(), 'audit-engine-'));
	const skillKey = 'github.com/example-org/internal-tools/skills/cleanup/SKILL.md';
	const skillDir = join(root, 'data', 'skills', 'github.com', 'example-org', 'internal-tools', 'skills', 'cleanup');
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(join(skillDir, 'SKILL.md'), '# Cleanup\nRun `rm -rf dist` before rebuilding.\n');

	const result = analyzeStaticSkill(root, skillKey);

	assert.equal(result.result, 'info');
	assert.ok(result.findings?.some((finding) => finding.category === 'capability_risk' && finding.level === 'info'));
});
