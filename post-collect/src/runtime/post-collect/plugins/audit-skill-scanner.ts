import { rmSync } from 'node:fs';
import { join } from 'node:path';
import type { BuiltinPostCollectPlugin, PostCollectPluginResult } from '../types.js';
import {
	buildUnknownSkillScannerResult,
	cleanupSkillScannerSummary,
	ensureSkillScannerAvailable,
	parseSkillScannerConfig,
	readSkillScannerJsonOutput,
	runSkillScannerScan,
	SKILL_SCANNER_LABEL_INTENTS,
	SKILL_SCANNER_PLUGIN_ID,
	SKILL_SCANNER_SUB_ARTIFACTS,
	summarizeSkillScannerOutput,
	type SkillScannerRunFiles,
} from './audit-skill-scanner-core.js';
import { getPluginArtifactFsDir, getPluginArtifactsRoot } from './sub-artifacts.js';

function isOrgOwnedSkill(skillKey: string, orgName: string | undefined): boolean {
	if (!orgName) return false;
	const parts = skillKey.split('/');
	return parts.length >= 4 && parts[1] === orgName;
}

function getSkillDir(projectRoot: string, skillKey: string): string {
	const parts = skillKey.split('/');
	const [platform, owner, repo, ...skillPathParts] = parts;
	const skillPath = skillPathParts.join('/');
	const skillDir = skillPath === 'SKILL.md' ? '' : skillPath.replace(/\/SKILL\.md$/, '');
	return join(projectRoot, 'data', 'skills', platform, owner, repo, skillDir);
}

function buildSummary(counts: Record<string, number>, scanned: number): string {
	return `${scanned} skill(s) scanned (${counts.safe} safe, ${counts.INFO} info, ${counts.LOW} low, ${counts.MEDIUM} medium, ${counts.HIGH} high, ${counts.CRITICAL} critical, ${counts.unknown} unknown)`;
}

export const auditSkillScannerPlugin: BuiltinPostCollectPlugin = {
	id: SKILL_SCANNER_PLUGIN_ID,
	async run(context): Promise<PostCollectPluginResult> {
		const config = parseSkillScannerConfig(context.plugin_config);
		const results: NonNullable<PostCollectPluginResult['results']> = {};
		const counts = { safe: 0, INFO: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, unknown: 0 };
		let scanned = 0;

		console.log('     audit-skill-scanner: scanning org-owned skills with skill-scanner');
		await ensureSkillScannerAvailable(config.command);
		rmSync(getPluginArtifactsRoot(context.project_root, SKILL_SCANNER_PLUGIN_ID), {
			recursive: true,
			force: true,
		});

		const getArtifactDir = (skillKey: string) => getPluginArtifactFsDir(context.project_root, SKILL_SCANNER_PLUGIN_ID, skillKey);

		for (const [repoKey, repoEntry] of Object.entries(context.catalog.repositories)) {
			for (const skillPath of Object.keys(repoEntry.skills)) {
				const skillKey = `${repoKey}/${skillPath}`;
				if (!isOrgOwnedSkill(skillKey, context.org_name)) continue;
				scanned += 1;

				const artifactDir = getArtifactDir(skillKey);
				const files: SkillScannerRunFiles = {
					summaryPath: join(artifactDir, 'summary.txt'),
					htmlPath: join(artifactDir, 'report.html'),
					sarifPath: join(artifactDir, 'report.sarif.json'),
					jsonPath: join(artifactDir, 'report.json'),
				};
				const skillDir = getSkillDir(context.project_root, skillKey);

				try {
					await runSkillScannerScan(config.command, skillDir, files, config.options);
					const output = readSkillScannerJsonOutput(files.jsonPath);
					const summary = summarizeSkillScannerOutput(output);
					results[skillKey] = summary;
					if (summary.label && summary.label in counts) {
						counts[summary.label as keyof typeof counts] += 1;
					} else {
						counts.unknown += 1;
					}
				} catch (error) {
					rmSync(artifactDir, { recursive: true, force: true });
					results[skillKey] = buildUnknownSkillScannerResult(
						error instanceof Error ? `skill-scanner execution failed: ${error.message}` : 'skill-scanner execution failed.',
					);
					counts.unknown += 1;
				} finally {
					cleanupSkillScannerSummary(files.summaryPath);
				}
			}
		}

		console.log(`     audit-skill-scanner: ${buildSummary(counts, scanned)}`);

		return {
			summary: buildSummary(counts, scanned),
			label_intents: SKILL_SCANNER_LABEL_INTENTS,
			sub_artifacts: [...SKILL_SCANNER_SUB_ARTIFACTS],
			results,
		};
	},
};
