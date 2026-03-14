import { spawnSync } from 'node:child_process';
import type { AuditEngineConfig, AuditEngineResult, AuditFinding, AuditResultValue } from './types.js';
import { analyzeStaticSkill } from './static-engine.js';

const RESULT_VALUES: AuditResultValue[] = ['pass', 'info', 'warn', 'fail'];

function isResultValue(value: unknown): value is AuditResultValue {
	return typeof value === 'string' && RESULT_VALUES.includes(value as AuditResultValue);
}

function sanitizeFinding(value: unknown): AuditFinding | null {
	if (!value || typeof value !== 'object') return null;
	const raw = value as Record<string, unknown>;
	if (typeof raw.summary !== 'string' || raw.summary.trim().length === 0) return null;

	const finding: AuditFinding = {
		summary: raw.summary,
	};

	if (raw.level === 'info' || raw.level === 'warn' || raw.level === 'fail') finding.level = raw.level;
	if (typeof raw.file === 'string' && raw.file.length > 0) finding.file = raw.file;
	if (typeof raw.line === 'number' && Number.isInteger(raw.line) && raw.line > 0) finding.line = raw.line;
	if (typeof raw.category === 'string' && raw.category.length > 0) finding.category = raw.category;
	if (Array.isArray(raw.references)) {
		const refs = raw.references.filter((item): item is string => typeof item === 'string' && item.length > 0);
		if (refs.length > 0) finding.references = refs;
	}

	return finding;
}

function parseEngineOutput(stdout: string): AuditEngineResult {
	if (!stdout.trim()) {
		throw new Error('Engine produced no JSON output.');
	}
	const parsed = JSON.parse(stdout) as Record<string, unknown>;
	if (!isResultValue(parsed.result)) {
		throw new Error('Engine result must include result: pass | info | warn | fail.');
	}

	const result: AuditEngineResult = {
		result: parsed.result,
	};

	if (typeof parsed.summary === 'string' && parsed.summary.trim().length > 0) {
		result.summary = parsed.summary;
	}

	if (Array.isArray(parsed.findings)) {
		const findings = parsed.findings.map(sanitizeFinding).filter((finding): finding is AuditFinding => finding != null);
		if (findings.length > 0) result.findings = findings;
	}

	return result;
}

function formatEngineFailure(summary: string): AuditEngineResult {
	return {
		result: 'fail',
		summary,
		findings: [
			{
				level: 'fail',
				summary,
			},
		],
	};
}

export function runAuditEngine(projectRoot: string, engine: AuditEngineConfig, skillKey: string): AuditEngineResult {
	if (engine.id === 'builtin.static') {
		return analyzeStaticSkill(projectRoot, skillKey);
	}

	if (!engine.command || engine.command.length === 0) {
		return formatEngineFailure(`Audit engine "${engine.id}" has no command configured.`);
	}

	const [cmd, ...args] = engine.command;
	const result = spawnSync(cmd, args, {
		cwd: projectRoot,
		input: skillKey,
		encoding: 'utf-8',
		timeout: engine.timeout_sec != null ? engine.timeout_sec * 1000 : undefined,
		maxBuffer: 1024 * 1024,
	});

	if (result.error) {
		const summary =
			result.error.name === 'TimeoutError'
				? `Audit engine "${engine.id}" timed out.`
				: `Audit engine "${engine.id}" failed: ${result.error.message}`;
		return formatEngineFailure(summary);
	}

	if (typeof result.status === 'number' && result.status !== 0) {
		const stderr = result.stderr.trim();
		return formatEngineFailure(
			stderr
				? `Audit engine "${engine.id}" exited with code ${result.status}: ${stderr}`
				: `Audit engine "${engine.id}" exited with code ${result.status}.`,
		);
	}

	try {
		return parseEngineOutput(result.stdout);
	} catch (error) {
		return formatEngineFailure(
			`Audit engine "${engine.id}" returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
