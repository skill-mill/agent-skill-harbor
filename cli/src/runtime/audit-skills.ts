import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseCliArgs } from './audit/utils.js';
import { runAudit } from './audit/run-audit.js';
import { updateCollectHistoryEntry } from './collect-history.js';

const PROJECT_ROOT = process.env.SKILL_HARBOR_ROOT || join(import.meta.dirname, '..', '..');

export function runAuditSkillsCli(argv: string[] = process.argv.slice(2)): void {
	const cliArgs = parseCliArgs(argv);
	const summary = runAudit({
		projectRoot: PROJECT_ROOT,
		force: cliArgs.force,
		engineIds: cliArgs.engineIds,
		log: true,
	});

	if (cliArgs.historyId) {
		updateCollectHistoryEntry(PROJECT_ROOT, cliArgs.historyId, (entry) => {
			return {
				...entry,
				auditing: summary.auditing,
				...(summary.report ? { report: summary.report } : {}),
			};
		});
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	runAuditSkillsCli(process.argv.slice(2));
}
