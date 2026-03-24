import type { FlatSkillEntry, UsagePolicy, Visibility } from '$lib/types';
import { getResolvedFromRepoLabel } from '$lib/utils/resolved-from';

export type OrgOwnership = 'org' | 'community';
export type OriginPresence = 'yes' | 'no';
export const PLUGIN_NO_LABEL_VALUE = '__none__';

export interface FilterState {
	status: UsagePolicy | null;
	visibility: Visibility | null;
	orgOwnership: OrgOwnership | null;
	hasOrigin: OriginPresence | null;
	pluginLabels: Record<string, string>;
}

export const defaultFilterState: FilterState = {
	status: null,
	visibility: null,
	orgOwnership: null,
	hasOrigin: null,
	pluginLabels: {},
};

export function filterSkills(skills: FlatSkillEntry[], filters: FilterState): FlatSkillEntry[] {
	return skills.filter((skill) => {
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
		for (const [pluginId, label] of Object.entries(filters.pluginLabels)) {
			const matched =
				label === PLUGIN_NO_LABEL_VALUE
					? !(skill.plugin_labels ?? []).some((entry) => entry.plugin_id === pluginId)
					: (skill.plugin_labels ?? []).some((entry) => entry.plugin_id === pluginId && entry.label === label);
			if (!matched) {
				return false;
			}
		}
		return true;
	});
}
