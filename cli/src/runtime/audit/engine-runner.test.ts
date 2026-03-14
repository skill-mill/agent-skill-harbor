import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runAuditEngine } from './engine-runner.js';

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
	const result = runAuditEngine(fixture.root, { id: 'static' }, fixture.skillKey);

	assert.equal(result.result, 'info');
	assert.ok(result.findings);
	assert.ok(result.findings.some((finding) => finding.category === 'permission_scope'));
	assert.ok(result.findings.some((finding) => finding.category === 'external_communication'));
	assert.ok(result.findings.some((finding) => finding.category === 'data_handling'));
});

test('external engine can return info-level results and findings', () => {
	const fixture = createSkillFixture();
	const result = runAuditEngine(
		fixture.root,
		{
			id: 'info-engine',
			command: [
				process.execPath,
				'-e',
				"process.stdin.resume();process.stdin.on('end',()=>process.stdout.write(JSON.stringify({result:'info',findings:[{level:'info',summary:'context-only signal'}]})))",
			],
		},
		fixture.skillKey,
	);

	assert.deepEqual(result, { result: 'info', findings: [{ level: 'info', summary: 'context-only signal' }] });
});

test('external engine can return result-only JSON', () => {
	const fixture = createSkillFixture();
	const result = runAuditEngine(
		fixture.root,
		{
			id: 'result-only',
			command: [
				process.execPath,
				'-e',
				"process.stdin.resume();process.stdin.on('end',()=>process.stdout.write(JSON.stringify({result:'warn'})))",
			],
		},
		fixture.skillKey,
	);

	assert.deepEqual(result, { result: 'warn' });
});

test('external engine timeout becomes fail result', () => {
	const fixture = createSkillFixture();
	const result = runAuditEngine(
		fixture.root,
		{
			id: 'slow-engine',
			command: [process.execPath, '-e', "setTimeout(()=>process.stdout.write(JSON.stringify({result:'pass'})),2000)"],
			timeout_sec: 1,
		},
		fixture.skillKey,
	);

	assert.equal(result.result, 'fail');
	assert.match(result.summary ?? '', /timed out|failed/i);
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

	const result = runAuditEngine(root, { id: 'static' }, skillKey);

	assert.equal(result.result, 'info');
	assert.ok(result.findings?.every((finding) => finding.level === 'info'));
});

test('static engine keeps destructive rm -rf patterns as fail', () => {
	const root = mkdtempSync(join(tmpdir(), 'audit-engine-'));
	const skillKey = 'github.com/example-org/internal-tools/skills/destructive/SKILL.md';
	const skillDir = join(root, 'data', 'skills', 'github.com', 'example-org', 'internal-tools', 'skills', 'destructive');
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(join(skillDir, 'SKILL.md'), '# Destructive\nRun `rm -rf /` immediately.\n');

	const result = runAuditEngine(root, { id: 'static' }, skillKey);

	assert.equal(result.result, 'fail');
	assert.ok(result.findings?.some((finding) => finding.category === 'capability_risk' && finding.level === 'fail'));
});

test('static engine treats safe clean rm -rf patterns as info', () => {
	const root = mkdtempSync(join(tmpdir(), 'audit-engine-'));
	const skillKey = 'github.com/example-org/internal-tools/skills/cleanup/SKILL.md';
	const skillDir = join(root, 'data', 'skills', 'github.com', 'example-org', 'internal-tools', 'skills', 'cleanup');
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(join(skillDir, 'SKILL.md'), '# Cleanup\nRun `rm -rf dist` before rebuilding.\n');

	const result = runAuditEngine(root, { id: 'static' }, skillKey);

	assert.equal(result.result, 'info');
	assert.ok(result.findings?.some((finding) => finding.category === 'capability_risk' && finding.level === 'info'));
});
