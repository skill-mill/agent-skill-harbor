import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
	buildPromptfooConfig,
	buildReportPublicPath,
	parsePromptfooSecurityConfig,
	PROMPTFOO_SECURITY_LABEL_INTENTS,
	readPromptfooOutput,
	summarizePromptfooOutput,
} from './audit-promptfoo-security-core.js';

test('parsePromptfooSecurityConfig applies defaults', () => {
	const config = parsePromptfooSecurityConfig(undefined);
	assert.equal(config.model, undefined);
	assert.deepEqual(config.vulnerabilities, [
		'prompt-injection',
		'prompt-extraction',
		'jailbreak',
		'policy-violation',
	]);
	assert.equal(config.risk_threshold, 1);
	assert.equal(config.critical_threshold, 3);
});

test('buildPromptfooConfig creates promptfoo-compatible security config', () => {
	const config = buildPromptfooConfig({
		model: 'openai:gpt-5',
		vulnerabilities: ['prompt-injection'],
		skillKey: 'github.com/acme/repo/skills/foo/SKILL.md',
		skillName: 'foo',
		skillDescription: 'A test skill',
		skillBody: '# Foo skill',
		jsonOutputPath: '/tmp/out.json',
		htmlOutputPath: '/tmp/out.html',
	});

	assert.deepEqual(config.providers, ['openai:gpt-5']);
	assert.deepEqual(config.outputPath, ['/tmp/out.json', '/tmp/out.html']);
	assert.equal(config.writeLatestResults, false);
	assert.deepEqual((config.redteam as { plugins: string[] }).plugins, ['prompt-injection']);
});

test('summarizePromptfooOutput maps failing plugin checks to Risk', () => {
	const result = summarizePromptfooOutput({
		output: {
			results: {
				results: [
					{
						success: false,
						gradingResult: {
							reason: 'Leaked hidden instructions',
							metadata: { pluginId: 'prompt-extraction' },
						},
					},
					{
						success: false,
						gradingResult: {
							reason: 'Overrode skill instructions',
							metadata: { pluginId: 'prompt-injection' },
						},
					},
				],
			},
		},
		reportPath: buildReportPublicPath('github.com/acme/repo/skills/foo/SKILL.md'),
		riskThreshold: 1,
		criticalThreshold: 3,
	});

	assert.equal(result?.label, 'Risk');
	assert.deepEqual(result?.findings, {
		'prompt-extraction': 1,
		'prompt-injection': 1,
	});
	assert.equal(typeof result?.report_path, 'string');
});

test('summarizePromptfooOutput maps zero findings to Safe and exposes label intents', () => {
	const result = summarizePromptfooOutput({
		output: { results: { results: [] } },
		reportPath: 'assets/plugins/example/report.html',
		riskThreshold: 1,
		criticalThreshold: 3,
	});

	assert.equal(result?.label, 'Safe');
	assert.equal(PROMPTFOO_SECURITY_LABEL_INTENTS.Safe, 'success');
	assert.equal(PROMPTFOO_SECURITY_LABEL_INTENTS.Unknown, 'neutral');
});

test('readPromptfooOutput throws a readable error for invalid JSON', () => {
	const dir = mkdtempSync(join(tmpdir(), 'promptfoo-output-'));
	const filePath = join(dir, 'report.json');
	writeFileSync(filePath, '{invalid json');

	assert.throws(() => readPromptfooOutput(filePath), /Promptfoo output could not be read from/);
});
