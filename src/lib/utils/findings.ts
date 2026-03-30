import type { FindingEntry, UsagePolicy, Visibility } from '$lib/types';
import { getResolvedFromRepoLabel } from '$lib/utils/resolved-from';
import { PLUGIN_NO_LABEL_VALUE, type FilterState, type OrgOwnership, type OriginPresence } from '$lib/utils/filter';

export function filterFindings(findings: FindingEntry[], filters: FilterState): FindingEntry[] {
	return findings.filter((finding) => {
		const skill = finding.skill;

		if (filters.status !== null && filters.status !== (skill.usage_policy as UsagePolicy)) {
			return false;
		}
		if (filters.visibility !== null && filters.visibility !== (skill.visibility as Visibility)) {
			return false;
		}
		if (filters.orgOwnership !== null) {
			const ownership: OrgOwnership = skill.isOrgOwned ? 'org' : 'community';
			if (filters.orgOwnership !== ownership) {
				return false;
			}
		}
		if (filters.hasOrigin !== null) {
			const hasOrigin = !!getResolvedFromRepoLabel(skill);
			if ((filters.hasOrigin === 'yes' && !hasOrigin) || (filters.hasOrigin === 'no' && hasOrigin)) {
				return false;
			}
		}

		const selectedLabel = filters.pluginLabels[finding.plugin_id];
		if (selectedLabel) {
			const label = selectedLabel;
			if (label === PLUGIN_NO_LABEL_VALUE) {
				return false;
			}
			if (finding.label !== label) {
				return false;
			}
		}

		return true;
	});
}

export function matchesFindingQuery(finding: FindingEntry, query: string): boolean {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return true;

	const skillName = String(finding.skill.frontmatter.name ?? '');
	const skillDescription = String(finding.skill.frontmatter.description ?? '');
	const pluginName = finding.plugin_short_label ?? finding.plugin_id;
	const haystack = [
		skillName,
		skillDescription,
		finding.skill.owner,
		finding.skill.repo,
		finding.skill.skillPath,
		pluginName,
		finding.plugin_id,
		finding.label,
		finding.summary ?? '',
	]
		.join('\n')
		.toLowerCase();

	return haystack.includes(normalized);
}
