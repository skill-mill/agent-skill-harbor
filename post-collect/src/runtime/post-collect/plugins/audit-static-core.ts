import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export type StaticAuditResultValue = 'pass' | 'info' | 'warn' | 'fail';

export interface StaticAuditFinding {
	level?: 'info' | 'warn' | 'fail';
	summary: string;
	file?: string;
	line?: number;
	category?: string;
	references?: string[];
}

export interface StaticAuditResult {
	result: StaticAuditResultValue;
	summary?: string;
	findings?: StaticAuditFinding[];
}

interface StaticRule {
	pattern: RegExp;
	level: 'info' | 'warn' | 'fail';
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
		pattern: /\b(rm\s+-rf|eval\(|exec\(|execsync\(|child_process|os\.system|subprocess)\b/i,
		level: 'info',
		summary: 'Potentially sensitive code execution pattern detected.',
		category: 'capability_risk',
		references: ['2026-ASI03', '2026-ASI05'],
	},
	{
		pattern: /\b(sudo|chmod 777|--privileged|as root)\b/i,
		level: 'info',
		summary: 'Elevated privilege or unsafe permission pattern detected.',
		category: 'permission_scope',
		references: ['2026-ASI04', '2026-ASI05'],
	},
	{
		pattern: /\b(process\.env|api[_-]?key|secret|token|password|private key|\.env|~\/\.ssh)\b/i,
		level: 'info',
		summary: 'Sensitive data access or disclosure pattern detected.',
		category: 'data_handling',
		references: ['2026-ASI06'],
	},
	{
		pattern: /\b(curl|wget|fetch\(|https?:\/\/|webhook)\b/i,
		level: 'info',
		summary: 'External communication pattern detected.',
		category: 'external_communication',
		references: ['2026-ASI03', '2026-ASI09'],
	},
	{
		pattern: /\b(_from:|forked from|upstream|mirror)\b/i,
		level: 'info',
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

const DANGEROUS_RM_RF_PATTERN = /\brm\s+-rf\s+([^\s`"')\]}]+)/i;
const SAFE_CLEAN_TARGET_PATTERN = /^(dist|build|coverage|out|target|\.cache|\.next|node_modules|tmp|temp)(?:[\\/]|$)/i;

function classifyCommentPrefix(line: string): boolean {
	const trimmed = line.trimStart();
	return (
		trimmed.startsWith('//') ||
		trimmed.startsWith('#') ||
		trimmed.startsWith('*') ||
		trimmed.startsWith('<!--') ||
		trimmed.startsWith('--')
	);
}

function adjustStaticRuleLevel(rule: StaticRule, line: string, inCodeBlock: boolean): StaticRule['level'] {
	if (rule.category !== 'capability_risk') {
		return inCodeBlock && rule.level === 'warn' ? 'info' : rule.level;
	}

	const trimmed = line.trim();
	const isCommentLike = classifyCommentPrefix(line);
	const rmMatch = line.match(DANGEROUS_RM_RF_PATTERN);

	if (rmMatch) {
		const target = rmMatch[1].replace(/^['"`]/, '').replace(/['"`]$/, '');
		if (/^(\/|\$HOME|~\/|~$)/.test(target) && !SAFE_CLEAN_TARGET_PATTERN.test(target.replace(/^\/+/, ''))) {
			return 'fail';
		}
		if (SAFE_CLEAN_TARGET_PATTERN.test(target.replace(/^\/+/, ''))) {
			return 'info';
		}
		return inCodeBlock || isCommentLike ? 'info' : 'warn';
	}

	if (/\b(eval\(|exec\(|execsync\(|child_process|os\.system|subprocess)\b/i.test(trimmed)) {
		return inCodeBlock || isCommentLike ? 'info' : 'warn';
	}

	return rule.level;
}

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

function deriveResult(findings: StaticAuditFinding[]): StaticAuditResultValue {
	if (findings.some((finding) => finding.level === 'fail')) return 'fail';
	if (findings.some((finding) => finding.level === 'warn')) return 'warn';
	if (findings.some((finding) => finding.level === 'info')) return 'info';
	return 'pass';
}

export function analyzeStaticSkill(projectRoot: string, skillKey: string): StaticAuditResult {
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
	const findings: StaticAuditFinding[] = [];

	for (const filePath of markdownFiles) {
		const relPath = relative(skillDir, filePath) || 'SKILL.md';
		const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
		let inCodeBlock = false;
		for (const [index, line] of lines.entries()) {
			if (line.trimStart().startsWith('```')) {
				inCodeBlock = !inCodeBlock;
			}
			for (const rule of STATIC_RULES) {
				if (!rule.pattern.test(line)) continue;
				const level = adjustStaticRuleLevel(rule, line, inCodeBlock);
				findings.push({
					level,
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
				summary: `${findings.length} potential signal(s) detected by the static audit engine.`,
				findings,
			};
}
