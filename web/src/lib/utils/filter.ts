import type { FlatSkillEntry, UsagePolicy, Visibility } from '$lib/types';

export type OrgOwnership = 'org' | 'community';

export interface FilterState {
	statuses: UsagePolicy[];
	visibilities: Visibility[];
	orgOwnerships: OrgOwnership[];
	pluginLabels: string[];
}

export const defaultFilterState: FilterState = {
	statuses: [],
	visibilities: [],
	orgOwnerships: [],
	pluginLabels: [],
};

export function filterSkills(skills: FlatSkillEntry[], filters: FilterState): FlatSkillEntry[] {
	return skills.filter((skill) => {
		if (filters.statuses.length > 0 && !filters.statuses.includes(skill.usage_policy as UsagePolicy)) {
			return false;
		}
		if (filters.visibilities.length > 0 && !filters.visibilities.includes(skill.visibility as Visibility)) {
			return false;
		}
		if (filters.orgOwnerships.length > 0) {
			const ownership: OrgOwnership = skill.isOrgOwned ? 'org' : 'community';
			if (!filters.orgOwnerships.includes(ownership)) {
				return false;
			}
		}
		if (filters.pluginLabels.length > 0) {
			const labels = new Set((skill.plugin_labels ?? []).map((entry) => entry.label));
			if (!filters.pluginLabels.every((label) => labels.has(label))) {
				return false;
			}
		}
		return true;
	});
}
