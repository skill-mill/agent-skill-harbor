import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { promisify } from 'node:util';
import type { LabelIntent, PostCollectSkillResult } from '../types.js';

export const SKILL_SCANNER_PLUGIN_ID = 'builtin.audit-skill-scanner';
export const SKILL_SCANNER_SUB_ARTIFACTS = ['report.html', 'report.sarif.json', 'report.json'] as const;

const execFileAsync = promisify(execFile);

const FORBIDDEN_OPTION_FLAGS = new Set([
	'--format',
	'--output',
	'-o',
	'--output-json',
	'--output-sarif',
	'--output-markdown',
	'--output-html',
	'--output-table',
]);

const VALUE_OPTION_FLAGS = new Set([
	'--output',
	'-o',
	'--output-json',
	'--output-sarif',
	'--output-markdown',
	'--output-html',
	'--output-table',
	'--fail-on-severity',
	'--vt-api-key',
	'--aidefense-api-key',
	'--aidefense-api-url',
	'--llm-provider',
	'--llm-consensus-runs',
	'--llm-max-tokens',
	'--policy',
	'--custom-rules',
	'--taxonomy',
	'--threat-mapping',
]);

export const SKILL_SCANNER_LABEL_INTENTS: Record<string, LabelIntent> = {
	CRITICAL: 'danger',
	HIGH: 'danger',
	MEDIUM: 'warn',
	LOW: 'warn',
	INFO: 'info',
	safe: 'success',
	unknown: 'neutral',
};

export interface SkillScannerConfig {
	command: string;
	options: string[];
}

export interface SkillScannerJsonOutput {
	is_safe?: boolean;
	max_severity?: string;
	findings_count?: number;
	analyzers_used?: string[];
}

export interface SkillScannerRunFiles {
	summaryPath: string;
	htmlPath: string;
	sarifPath: string;
	jsonPath: string;
}

function splitOptionsString(input: string): string[] {
	const tokens: string[] = [];
	let current = '';
	let quote: '"' | "'" | null = null;
	let escaping = false;

	for (const char of input) {
		if (escaping) {
			current += char;
			escaping = false;
			continue;
		}
		if (char === '\\') {
			escaping = true;
			continue;
		}
		if (quote) {
			if (char === quote) {
				quote = null;
			} else {
				current += char;
			}
			continue;
		}
		if (char === '"' || char === "'") {
			quote = char;
			continue;
		}
		if (/\s/.test(char)) {
			if (current.length > 0) {
				tokens.push(current);
				current = '';
			}
			continue;
		}
		current += char;
	}

	if (escaping) current += '\\';
	if (quote) {
		throw new Error(`Unterminated quote in skill-scanner options: ${input}`);
	}
	if (current.length > 0) tokens.push(current);
	return tokens;
}

function extractFlagName(token: string): string {
	const equalIndex = token.indexOf('=');
	return equalIndex >= 0 ? token.slice(0, equalIndex) : token;
}

function validateOptionTokens(tokens: string[]): void {
	let expectingValueFor: string | null = null;

	for (const token of tokens) {
		if (expectingValueFor) {
			expectingValueFor = null;
			continue;
		}

		if (token === '--') {
			throw new Error('skill-scanner config.options must not include positional arguments.');
		}

		if (!token.startsWith('-')) {
			throw new Error('skill-scanner config.options must contain flags only. Positional arguments are not allowed.');
		}

		const flagName = extractFlagName(token);
		if (FORBIDDEN_OPTION_FLAGS.has(flagName)) {
			throw new Error(`builtin.audit-skill-scanner does not allow overriding ${flagName} via config.options.`);
		}

		if (VALUE_OPTION_FLAGS.has(flagName) && !token.includes('=')) {
			expectingValueFor = flagName;
		}
	}

	if (expectingValueFor) {
		throw new Error(`skill-scanner config.options is missing a value for ${expectingValueFor}.`);
	}
}

export function parseSkillScannerConfig(config: Record<string, unknown> | undefined): SkillScannerConfig {
	const command =
		typeof config?.command === 'string' && config.command.trim().length > 0 ? config.command.trim() : 'skill-scanner';
	const rawOptions = typeof config?.options === 'string' ? config.options.trim() : '';
	const options = rawOptions.length > 0 ? splitOptionsString(rawOptions) : [];
	validateOptionTokens(options);
	return { command, options };
}

export function buildSkillScannerRaw(output: SkillScannerJsonOutput): string {
	const findingsCount = typeof output.findings_count === 'number' && Number.isFinite(output.findings_count) ? output.findings_count : 0;
	const findingLabel = findingsCount === 1 ? 'finding' : 'findings';
	const safeText = typeof output.is_safe === 'boolean' ? ` (scanner safe=${String(output.is_safe)})` : '';
	if (findingsCount <= 0) return `0 findings${safeText}`;
	if (typeof output.max_severity === 'string' && output.max_severity.length > 0) {
		return `${findingsCount} ${findingLabel}, max severity ${output.max_severity}${safeText}`;
	}
	return `${findingsCount} ${findingLabel}${safeText}`;
}

export function summarizeSkillScannerOutput(output: SkillScannerJsonOutput): PostCollectSkillResult {
	const findingsCount = typeof output.findings_count === 'number' && Number.isFinite(output.findings_count) ? output.findings_count : 0;
	const label =
		findingsCount <= 0
			? 'safe'
			: typeof output.max_severity === 'string' && output.max_severity.length > 0
				? output.max_severity
				: 'unknown';

	return {
		label,
		raw: buildSkillScannerRaw(output),
		findings_count: findingsCount,
		...(typeof output.max_severity === 'string' && output.max_severity.length > 0
			? { max_severity: output.max_severity }
			: {}),
		...(typeof output.is_safe === 'boolean' ? { is_safe: output.is_safe } : {}),
	};
}

export function buildUnknownSkillScannerResult(raw: string): PostCollectSkillResult {
	return { label: 'unknown', raw };
}

export function readSkillScannerJsonOutput(jsonPath: string): SkillScannerJsonOutput {
	try {
		return JSON.parse(readFileSync(jsonPath, 'utf-8')) as SkillScannerJsonOutput;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`skill-scanner JSON output could not be read from "${jsonPath}": ${message}`);
	}
}

export async function ensureSkillScannerAvailable(command: string): Promise<void> {
	try {
		await execFileAsync(command, ['--version'], { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 4 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`skill-scanner CLI is unavailable: ${message}`);
	}
}

export async function runSkillScannerScan(command: string, skillDir: string, files: SkillScannerRunFiles, options: string[]): Promise<void> {
	mkdirSync(dirname(files.htmlPath), { recursive: true });
	const args = [
		'scan',
		skillDir,
		// Keep summary first and preserve this format/output ordering.
		// skill-scanner currently misroutes secondary output files unless an initial
		// format/output pair appears before the per-format output flags.
		// We do not use summary.txt beyond this compatibility workaround.
		'--format',
		'summary',
		'--output',
		files.summaryPath,
		'--format',
		'html',
		'--output-html',
		files.htmlPath,
		'--format',
		'sarif',
		'--output-sarif',
		files.sarifPath,
		'--format',
		'json',
		'--output-json',
		files.jsonPath,
		'--use-behavioral',
		'--use-trigger',
		'--lenient',
		...options,
	];
	await execFileAsync(command, args, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 4 });
}

export function cleanupSkillScannerSummary(summaryPath: string): void {
	rmSync(summaryPath, { force: true });
}
