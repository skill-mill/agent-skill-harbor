import assert from 'node:assert/strict';
import test from 'node:test';
import {
	buildSkillScannerRaw,
	parseSkillScannerConfig,
	SKILL_SCANNER_LABEL_INTENTS,
	summarizeSkillScannerOutput,
} from './audit-skill-scanner-core.js';

test('parseSkillScannerConfig applies defaults', () => {
	const config = parseSkillScannerConfig(undefined);
	assert.equal(config.command, 'skill-scanner');
	assert.deepEqual(config.options, []);
});

test('parseSkillScannerConfig tokenizes quoted options', () => {
	const config = parseSkillScannerConfig({
		command: '/opt/homebrew/bin/skill-scanner',
		options: '--policy "strict" --custom-rules "/tmp/custom rules"',
	});

	assert.equal(config.command, '/opt/homebrew/bin/skill-scanner');
	assert.deepEqual(config.options, ['--policy', 'strict', '--custom-rules', '/tmp/custom rules']);
});

test('parseSkillScannerConfig rejects output override flags', () => {
	assert.throws(
		() => parseSkillScannerConfig({ options: '--format json --policy strict' }),
		/does not allow overriding --format/i,
	);
});

test('parseSkillScannerConfig rejects positional arguments', () => {
	assert.throws(
		() => parseSkillScannerConfig({ options: '--policy strict ./skill-dir' }),
		/positional arguments are not allowed/i,
	);
});

test('summarizeSkillScannerOutput maps findings to max severity label', () => {
	const result = summarizeSkillScannerOutput({
		is_safe: true,
		max_severity: 'MEDIUM',
		findings_count: 1,
		findings: [{ description: 'Only 76% of skill content could be analyzed.' }],
	});

	assert.equal(result.label, 'MEDIUM');
	assert.equal(result.raw, '1 finding, max severity MEDIUM (scanner safe=true)');
	assert.deepEqual(result.findings, ['Only 76% of skill content could be analyzed.']);
});

test('summarizeSkillScannerOutput maps zero findings to safe', () => {
	const result = summarizeSkillScannerOutput({
		is_safe: true,
		findings_count: 0,
	});

	assert.equal(result.label, 'safe');
	assert.equal(result.raw, '0 findings (scanner safe=true)');
	assert.equal(SKILL_SCANNER_LABEL_INTENTS.CRITICAL, 'danger');
	assert.equal(SKILL_SCANNER_LABEL_INTENTS.safe, 'success');
});

test('buildSkillScannerRaw omits severity when absent', () => {
	assert.equal(buildSkillScannerRaw({ findings_count: 2, is_safe: false }), '2 findings (scanner safe=false)');
});

test('summarizeSkillScannerOutput preserves finding positions when descriptions are missing', () => {
	const result = summarizeSkillScannerOutput({
		findings_count: 3,
		findings: [
			{ description: 'First finding' },
			{ description: ' First finding ' },
			{ description: '' },
			{},
			{ description: 'Second finding' },
		],
	});

	assert.deepEqual(result.findings, ['First finding', 'First finding', '', '', 'Second finding']);
});
