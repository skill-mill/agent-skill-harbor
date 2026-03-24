import { readFileSync } from 'node:fs';
import { parseFrontmatter } from '../../shared/frontmatter.js';
import { parseResolvedFromRef, resolveSkillLookupName, type ProjectSkillsLockEntry } from '../../shared/resolved-from.js';
import type { BuiltinPostCollectPlugin, PostCollectCatalog, PostCollectPluginResult } from '../types.js';

function readSkillIdentity(skillFilePath: string, skillPath: string): string | null {
	try {
		const frontmatter = parseFrontmatter(readFileSync(skillFilePath, 'utf-8'));
		return resolveSkillLookupName(frontmatter, skillPath);
	} catch {
		return null;
	}
}

function findOriginSkillPath(
	catalog: PostCollectCatalog,
	repoKey: string,
	identity: string | null,
	skillIdentityCache: Map<string, string | null>,
	buildSkillFilePath: (repoKey: string, skillPath: string) => string,
): string | null {
	if (!identity) return null;
	const originRepo = catalog.repositories[repoKey];
	if (!originRepo) return null;
	for (const originSkillPath of Object.keys(originRepo.skills)) {
		const cacheKey = `${repoKey}:${originSkillPath}`;
		if (!skillIdentityCache.has(cacheKey)) {
			skillIdentityCache.set(
				cacheKey,
				readSkillIdentity(buildSkillFilePath(repoKey, originSkillPath), originSkillPath),
			);
		}
		if (skillIdentityCache.get(cacheKey) === identity) return originSkillPath;
	}
	return null;
}

export const detectDriftPlugin: BuiltinPostCollectPlugin = {
	id: 'builtin.detect-drift',
	run(context): PostCollectPluginResult {
		const results: PostCollectPluginResult['results'] = {};
		const skillIdentityCache = new Map<string, string | null>();
		const buildSkillFilePath = (repoKey: string, skillPath: string) =>
			`${context.paths.skills_dir}/${repoKey}/${skillPath}`;
		let checked = 0;

		console.log('     detect-drift: scanning collected skills for origin drift');
		for (const [repoKey, repoEntry] of Object.entries(context.catalog.repositories)) {
			for (const [skillPath, skillEntry] of Object.entries(repoEntry.skills)) {
				const skillKey = `${repoKey}/${skillPath}`;
				if (!skillEntry.resolved_from) continue;
				checked += 1;
				const parsed = parseResolvedFromRef(skillEntry.resolved_from);
				if (!parsed?.sha) {
					results[skillKey] = { label: 'Unknown', raw: 'Resolved origin SHA is missing.' };
					continue;
				}
				const originRepo = context.catalog.repositories[parsed.repoKey];
				if (!originRepo) {
					results[skillKey] = { label: 'Unknown', raw: 'Origin repository was not collected.' };
					continue;
				}
				const cacheKey = `${repoKey}:${skillPath}`;
				if (!skillIdentityCache.has(cacheKey)) {
					skillIdentityCache.set(cacheKey, readSkillIdentity(buildSkillFilePath(repoKey, skillPath), skillPath));
				}
				const identity = skillIdentityCache.get(cacheKey) ?? null;
				const originSkillPath = findOriginSkillPath(
					context.catalog,
					parsed.repoKey,
					identity,
					skillIdentityCache,
					buildSkillFilePath,
				);
				if (!originSkillPath) {
					results[skillKey] = { label: 'Unknown', raw: 'Matching origin skill could not be resolved.' };
					continue;
				}
				const originSkill = originRepo.skills[originSkillPath];
				if (!originSkill?.tree_sha) {
					results[skillKey] = { label: 'Unknown', raw: 'Origin skill tree SHA is missing.' };
					continue;
				}
				const inSync = originSkill.tree_sha.startsWith(parsed.sha);
				results[skillKey] = {
					label: inSync ? 'In sync' : 'Drifted',
					raw: inSync
						? 'Collected copy matches the current origin skill tree.'
						: 'Collected copy differs from the current origin skill tree.',
				};
			}
		}

		const counts = { 'In sync': 0, Drifted: 0, Unknown: 0 };
		for (const result of Object.values(results)) {
			if (result?.label === 'In sync' || result?.label === 'Drifted' || result?.label === 'Unknown') {
				counts[result.label] += 1;
			}
		}
		console.log(
			`     detect-drift: checked ${checked} skill(s) (${counts['In sync']} in sync, ${counts.Drifted} drifted, ${counts.Unknown} unknown)`,
		);

		return {
			summary: `${Object.keys(results).length} skill(s) checked for drift.`,
			label_intents: {
				'In sync': 'success',
				Drifted: 'warn',
				Unknown: 'neutral',
			},
			results,
		};
	},
};
