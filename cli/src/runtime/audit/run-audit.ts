import { join } from 'node:path';
import { loadAuditResults, saveAuditResults } from './result-store.js';
import { runAuditEngine } from './engine-runner.js';
import {
	compareAuditResults,
	detectOrgName,
	filterAuditSkills,
	loadAuditSettings,
	loadCatalogSkills,
	resolveAuditEngines,
} from './utils.js';
import { DEFAULT_ENGINE_TIMEOUT_SEC, MAX_ENGINE_TIMEOUT_SEC } from './types.js';
import type {
	AuditEngineConfig,
	AuditHistoryReport,
	AuditHistoryReportBucket,
	AuditResultCounts,
	AuditResultValue,
	AuditRunSummary,
	AuditSkillResult,
	CatalogSkillEntry,
} from './types.js';

function emptyCounts(): AuditResultCounts {
	return { pass: 0, info: 0, warn: 0, fail: 0 };
}

function emptyBucket(): AuditHistoryReportBucket {
	return {
		processed: emptyCounts(),
		skipped: emptyCounts(),
	};
}

function emptyReport(): AuditHistoryReport {
	return {
		org: emptyBucket(),
		community: emptyBucket(),
	};
}

function deriveOverall(skill: AuditSkillResult): AuditResultValue {
	return Object.values(skill.engines).reduce<AuditResultValue>((current, engine) => {
		return compareAuditResults(engine.result, current) > 0 ? engine.result : current;
	}, 'pass');
}

function formatEngineSummary(engines: AuditEngineConfig[]): string {
	return engines
		.map((engine) => {
			if (engine.id === 'static') return 'static(built-in)';
			const timeout = engine.timeout_sec ?? 'n/a';
			return `${engine.id}(timeout=${timeout}s)`;
		})
		.join(', ');
}

function bucketForSkill(skill: CatalogSkillEntry, orgName: string | null): 'org' | 'community' {
	return orgName != null && skill.repoKey.split('/')[1] === orgName ? 'org' : 'community';
}

interface RunAuditOptions {
	projectRoot: string;
	force?: boolean;
	engineIds?: string[];
	log?: boolean;
}

export function runAudit(options: RunAuditOptions): AuditRunSummary {
	const startedAt = Date.now();
	const settings = loadAuditSettings(options.projectRoot);
	const selectedEngines = resolveAuditEngines(settings, options.engineIds);
	const reportPath = join(options.projectRoot, 'data', 'report.yaml');
	const log = options.log ?? true;

	if (selectedEngines.length === 0) {
		const auditing = {
			audited_at: new Date().toISOString(),
			duration_sec: 0,
			engines: [] as string[],
			skipped: true,
			skip_reason: 'no_engines',
		};
		if (log) {
			console.log('Audit settings:');
			console.log(`  exclude_community_repos: ${settings.exclude_community_repos}`);
			console.log(`  force: ${options.force ?? false}`);
			console.log(`  timeout: default=${DEFAULT_ENGINE_TIMEOUT_SEC}s, max=${MAX_ENGINE_TIMEOUT_SEC}s`);
			console.log('  engines: (none)');
			console.log('No audit engines configured. Skipping audit.');
		}
		return {
			overall: 'pass',
			total: 0,
			skipped: 0,
			processed: 0,
			duration_ms: 0,
			average_duration_ms: 0,
			auditing,
		};
	}

	const orgName = detectOrgName(options.projectRoot);
	const catalogSkills = filterAuditSkills(
		loadCatalogSkills(options.projectRoot),
		settings.exclude_community_repos,
		orgName,
	);
	const existing = loadAuditResults(reportPath);
	const nextResults: Record<string, AuditSkillResult> = {};
	const report = emptyReport();
	let skippedCount = 0;

	if (log) {
		console.log('Audit settings:');
		console.log(`  exclude_community_repos: ${settings.exclude_community_repos}`);
		console.log(`  force: ${options.force ?? false}`);
		console.log(`  timeout: default=${DEFAULT_ENGINE_TIMEOUT_SEC}s, max=${MAX_ENGINE_TIMEOUT_SEC}s`);
		console.log(`  engines: ${formatEngineSummary(selectedEngines)}`);
		console.log(`Auditing ${catalogSkills.length} skill(s)...`);
	}

	for (const skill of catalogSkills) {
		const current = existing.results[skill.skillKey] ?? {
			tree_sha: skill.treeSha,
			engines: {},
		};
		const engines = { ...current.engines };
		const hasAllSelectedResults = selectedEngines.every((engine) => engines[engine.id] != null);
		const shouldSkip = !(options.force ?? false) && current.tree_sha === skill.treeSha && hasAllSelectedResults;
		const bucket = report[bucketForSkill(skill, orgName)];

		if (shouldSkip) {
			skippedCount++;
			const result = deriveOverall(current);
			bucket.skipped[result]++;
			nextResults[skill.skillKey] = {
				tree_sha: current.tree_sha,
				engines,
			};
			continue;
		}

		if (log) console.log(`- ${skill.skillKey}`);
		for (const engine of selectedEngines) {
			engines[engine.id] = runAuditEngine(options.projectRoot, engine, skill.skillKey);
			if (log) console.log(`  ${engine.id}: ${engines[engine.id].result}`);
		}

		const nextSkill = {
			tree_sha: skill.treeSha,
			engines,
		};
		const result = deriveOverall(nextSkill);
		bucket.processed[result]++;
		nextResults[skill.skillKey] = nextSkill;
	}

	saveAuditResults(reportPath, { results: nextResults });

	const overall = Object.values(nextResults).reduce<AuditResultValue>((current, skill) => {
		const skillResult = deriveOverall(skill);
		return compareAuditResults(skillResult, current) > 0 ? skillResult : current;
	}, 'pass');
	const processedCount = catalogSkills.length - skippedCount;
	const durationMs = Date.now() - startedAt;
	const averageDurationMs = processedCount > 0 ? durationMs / processedCount : 0;
	const auditing = {
		audited_at: new Date().toISOString(),
		duration_sec: Math.round(durationMs / 1000),
		engines: selectedEngines.map((engine) => engine.id),
		skipped: false,
	};

	if (log) {
		const processedCounts = addCounts(report.org.processed, report.community.processed);
		const skippedCounts = addCounts(report.org.skipped, report.community.skipped);
		console.log(`Audit complete: ${overall}`);
		console.log('Audit summary:');
		console.log(`  total: ${catalogSkills.length}`);
		console.log(`  skipped: ${skippedCount}`);
		console.log(`  processed: ${processedCount}`);
		console.log(`  processed.pass: ${processedCounts.pass}`);
		console.log(`  processed.info: ${processedCounts.info}`);
		console.log(`  processed.warn: ${processedCounts.warn}`);
		console.log(`  processed.fail: ${processedCounts.fail}`);
		console.log(`  skipped.pass: ${skippedCounts.pass}`);
		console.log(`  skipped.info: ${skippedCounts.info}`);
		console.log(`  skipped.warn: ${skippedCounts.warn}`);
		console.log(`  skipped.fail: ${skippedCounts.fail}`);
		console.log(`  duration_ms: ${durationMs}`);
		console.log(`  avg_per_skill_ms: ${averageDurationMs.toFixed(1)}`);
	}

	return {
		overall,
		total: catalogSkills.length,
		skipped: skippedCount,
		processed: processedCount,
		duration_ms: durationMs,
		average_duration_ms: averageDurationMs,
		report,
		auditing,
	};
}

function addCounts(a: AuditResultCounts, b: AuditResultCounts): AuditResultCounts {
	return {
		pass: a.pass + b.pass,
		info: a.info + b.info,
		warn: a.warn + b.warn,
		fail: a.fail + b.fail,
	};
}
