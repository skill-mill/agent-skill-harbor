import { join } from 'node:path';
import { loadAuditResults, saveAuditResults } from './audit/result-store.js';
import { runAuditEngine } from './audit/engine-runner.js';
import {
	compareAuditResults,
	detectOrgName,
	filterAuditSkills,
	loadAuditSettings,
	loadCatalogSkills,
	parseCliArgs,
	resolveAuditEngines,
} from './audit/utils.js';
import type { AuditResultValue, AuditSkillResult } from './audit/types.js';

const PROJECT_ROOT = process.env.SKILL_HARBOR_ROOT || join(import.meta.dirname, '..', '..');
const RESULTS_PATH = join(PROJECT_ROOT, 'data', 'audit-results.yaml');

function deriveOverall(skill: AuditSkillResult): AuditResultValue {
	return Object.values(skill.engines).reduce<AuditResultValue>((current, engine) => {
		return compareAuditResults(engine.result, current) > 0 ? engine.result : current;
	}, 'pass');
}

const cliArgs = parseCliArgs(process.argv.slice(2));
const settings = loadAuditSettings(PROJECT_ROOT);
const selectedEngines = resolveAuditEngines(settings, cliArgs.engineIds);

if (selectedEngines.length === 0) {
	console.log('No audit engines configured. Skipping audit.');
	process.exit(0);
}

const orgName = detectOrgName(PROJECT_ROOT);
const catalogSkills = filterAuditSkills(loadCatalogSkills(PROJECT_ROOT), settings.exclude_community_repos, orgName);
const existing = loadAuditResults(RESULTS_PATH);
const nextResults: Record<string, AuditSkillResult> = {};

console.log(`Auditing ${catalogSkills.length} skill(s)...`);

for (const skill of catalogSkills) {
	const current = existing.results[skill.skillKey] ?? {
		tree_sha: skill.treeSha,
		engines: {},
	};
	const engines = { ...current.engines };
	const hasAllSelectedResults = selectedEngines.every((engine) => engines[engine.id] != null);
	const shouldSkip = !cliArgs.force && current.tree_sha === skill.treeSha && hasAllSelectedResults;

	if (shouldSkip) {
		nextResults[skill.skillKey] = {
			tree_sha: current.tree_sha,
			engines,
		};
		continue;
	}

	console.log(`- ${skill.skillKey}`);
	for (const engine of selectedEngines) {
		engines[engine.id] = runAuditEngine(PROJECT_ROOT, engine, skill.skillKey);
		console.log(`  ${engine.id}: ${engines[engine.id].result}`);
	}

	nextResults[skill.skillKey] = {
		tree_sha: skill.treeSha,
		engines,
	};
}

saveAuditResults(RESULTS_PATH, { results: nextResults });

const overall = Object.values(nextResults).reduce<AuditResultValue>((current, skill) => {
	const skillResult = deriveOverall(skill);
	return compareAuditResults(skillResult, current) > 0 ? skillResult : current;
}, 'pass');

console.log(`Audit complete: ${overall}`);
if (compareAuditResults(overall, settings.fail_on) >= 0) {
	process.exit(1);
}
