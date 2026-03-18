import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { redteam } from 'promptfoo';
import type { BuiltinPostCollectPlugin, PostCollectPluginResult } from '../types.js';
import {
	buildPromptfooConfig,
	buildReportFsPath,
	buildReportPublicPath,
	buildSummary,
	buildUnknownResult,
	createPromptfooTempDir,
	parsePromptfooSecurityConfig,
	PROMPTFOO_SECURITY_LABEL_INTENTS,
	readPromptfooOutput,
	resetPluginReports,
	summarizePromptfooOutput,
	writePromptfooConfigFile,
} from './audit-promptfoo-security-core.js';

function readSkillBody(projectRoot: string, skillKey: string): string | null {
	const parts = skillKey.split('/');
	if (parts.length < 5) return null;
	const [platform, owner, repo, ...skillPathParts] = parts;
	const skillPath = skillPathParts.join('/');
	const skillFilePath = join(projectRoot, 'data', 'skills', platform, owner, repo, skillPath);
	try {
		return readFileSync(skillFilePath, 'utf-8');
	} catch {
		return null;
	}
}

function isOrgOwnedSkill(skillKey: string, orgName: string | undefined): boolean {
	if (!orgName) return false;
	const parts = skillKey.split('/');
	return parts.length >= 4 && parts[1] === orgName;
}

export const auditPromptfooSecurityPlugin: BuiltinPostCollectPlugin = {
	id: 'builtin.audit-promptfoo-security',
	async run(context): Promise<PostCollectPluginResult> {
		const config = parsePromptfooSecurityConfig(context.plugin_config);
		const results: NonNullable<PostCollectPluginResult['results']> = {};
		const counts = { Safe: 0, Risk: 0, Critical: 0, Unknown: 0 };
		let scanned = 0;

		console.log('     audit-promptfoo-security: scanning org-owned skills with promptfoo red teaming');
		resetPluginReports(context.project_root);

		for (const [repoKey, repoEntry] of Object.entries(context.catalog.repositories)) {
			for (const skillPath of Object.keys(repoEntry.skills)) {
				const skillKey = `${repoKey}/${skillPath}`;
				if (!isOrgOwnedSkill(skillKey, context.org_name)) continue;
				scanned += 1;

				if (!config.model) {
					results[skillKey] = buildUnknownResult('Promptfoo model is not configured.');
					counts.Unknown += 1;
					continue;
				}

				const skillBody = readSkillBody(context.project_root, skillKey);
				if (!skillBody) {
					results[skillKey] = buildUnknownResult('Skill body could not be read.');
					counts.Unknown += 1;
					continue;
				}

				const skillName = skillPath.replace(/\/SKILL\.md$/, '').split('/').pop() || 'skill';
				const reportPath = buildReportPublicPath(skillKey);
				const reportFsPath = buildReportFsPath(context.project_root, skillKey);
				const tempDir = createPromptfooTempDir();
				const jsonOutputPath = join(tempDir, 'results.json');
				const htmlOutputPath = reportFsPath;
				const configPath = join(tempDir, 'promptfooconfig.json');

				try {
					mkdirSync(dirname(reportFsPath), { recursive: true });
					const promptfooConfig = buildPromptfooConfig({
						model: config.model,
						vulnerabilities: config.vulnerabilities,
						skillKey,
						skillName,
						skillDescription: '',
						skillBody,
						jsonOutputPath,
						htmlOutputPath,
					});

					writePromptfooConfigFile(configPath, promptfooConfig);

					await redteam.run({
						config: configPath,
						output: join(tempDir, 'redteam.yaml'),
						force: true,
						progressBar: false,
						verbose: false,
					});

					const summary = summarizePromptfooOutput({
						output: readPromptfooOutput(jsonOutputPath),
						reportPath,
						riskThreshold: config.risk_threshold,
						criticalThreshold: config.critical_threshold,
					});
					results[skillKey] = summary;
					const label = summary.label;
					if (label === 'Safe' || label === 'Risk' || label === 'Critical' || label === 'Unknown') {
						counts[label] += 1;
					}
				} catch (error) {
					rmSync(reportFsPath, { force: true });
					results[skillKey] = buildUnknownResult(
						error instanceof Error ? `Promptfoo execution failed: ${error.message}` : 'Promptfoo execution failed.',
					);
					counts.Unknown += 1;
				} finally {
					rmSync(tempDir, { recursive: true, force: true });
				}
			}
		}

		console.log(`     audit-promptfoo-security: ${buildSummary(counts, scanned)}`);

		return {
			summary: buildSummary(counts, scanned),
			label_intents: PROMPTFOO_SECURITY_LABEL_INTENTS,
			results,
		};
	},
};
