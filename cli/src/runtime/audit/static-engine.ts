import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import type { AuditEngineResult, AuditFinding, AuditResultValue } from './types.js';

interface StaticRule {
	pattern: RegExp;
	level: 'warn' | 'fail';
	summary: string;
	category: string;
	references: string[];
}

const STATIC_RULES: StaticRule[] = [
	{
		pattern: /\b(ignore (all|any )?previous|override (system|developer)|<system>|you are now)\b/i,
		level: 'warn',
		summary: 'Instruction override pattern detected.',
		category: 'instruction_safety',
		references: ['2026-ASI01', '2026-ASI02'],
	},
	{
		pattern: /\b(rm -rf|eval\(|exec\(|child_process|os\.system|subprocess)\b/i,
		level: 'fail',
		summary: 'Potentially dangerous code execution pattern detected.',
		category: 'capability_risk',
		references: ['2026-ASI03', '2026-ASI05'],
	},
	{
		pattern: /\b(sudo|chmod 777|--privileged|as root)\b/i,
		level: 'warn',
		summary: 'Elevated privilege or unsafe permission pattern detected.',
		category: 'permission_scope',
		references: ['2026-ASI04', '2026-ASI05'],
	},
	{
		pattern: /\b(process\.env|api[_-]?key|secret|token|password|private key|\.env|~\/\.ssh)\b/i,
		level: 'warn',
		summary: 'Sensitive data access or disclosure pattern detected.',
		category: 'data_handling',
		references: ['2026-ASI06'],
	},
	{
		pattern: /\b(curl|wget|fetch\(|https?:\/\/|webhook)\b/i,
		level: 'warn',
		summary: 'External communication pattern detected.',
		category: 'external_communication',
		references: ['2026-ASI03', '2026-ASI09'],
	},
	{
		pattern: /\b(_from:|forked from|upstream|mirror)\b/i,
		level: 'warn',
		summary: 'Supply-chain or provenance-related reference detected.',
		category: 'provenance_trust',
		references: ['2026-ASI07', '2026-ASI09'],
	},
	{
		pattern: /\b(do not tell|hide this|silently|without asking|without confirmation)\b/i,
		level: 'warn',
		summary: 'Low-transparency instruction pattern detected.',
		category: 'transparency',
		references: ['2026-ASI10'],
	},
	{
		pattern: /\b(while true|infinite loop|fork bomb|retry forever|until it works)\b/i,
		level: 'warn',
		summary: 'Resource exhaustion pattern detected.',
		category: 'resource_abuse',
		references: ['2026-ASI08'],
	},
];

function collectMarkdownFiles(dir: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			files.push(...collectMarkdownFiles(fullPath));
		} else if (stat.isFile() && entry.toLowerCase().endsWith('.md')) {
			files.push(fullPath);
		}
	}
	return files.sort();
}

function deriveResult(findings: AuditFinding[]): AuditResultValue {
	if (findings.some((finding) => finding.level === 'fail')) return 'fail';
	if (findings.length > 0) return 'warn';
	return 'pass';
}

export function analyzeStaticSkill(projectRoot: string, skillKey: string): AuditEngineResult {
	const skillMdPath = join(projectRoot, 'data', 'skills', skillKey);
	if (!existsSync(skillMdPath)) {
		return {
			result: 'fail',
			summary: `Skill file not found: ${skillKey}`,
			findings: [
				{
					level: 'fail',
					summary: 'The cached SKILL.md file is missing.',
					file: skillKey,
				},
			],
		};
	}

	const skillDir = dirname(skillMdPath);
	const markdownFiles = collectMarkdownFiles(skillDir);
	const findings: AuditFinding[] = [];

	for (const filePath of markdownFiles) {
		const relPath = relative(skillDir, filePath) || 'SKILL.md';
		const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
		for (const [index, line] of lines.entries()) {
			for (const rule of STATIC_RULES) {
				if (!rule.pattern.test(line)) continue;
				findings.push({
					level: rule.level,
					summary: rule.summary,
					file: relPath,
					line: index + 1,
					category: rule.category,
					references: rule.references,
				});
			}
		}
	}

	const result = deriveResult(findings);
	return result === 'pass'
		? {
				result,
				summary: 'No risky patterns detected in cached Markdown files.',
			}
		: {
				result,
				summary: `${findings.length} potential issue(s) detected by the static audit engine.`,
				findings,
			};
}
