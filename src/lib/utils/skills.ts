import type { FlatSkillEntry } from '$lib/types';

const DAY_MS = 86_400_000;

export function isSkillNew(skill: Pick<FlatSkillEntry, 'registered_at'>, freshPeriodDays: number): boolean {
	return (
		freshPeriodDays > 0 &&
		!!skill.registered_at &&
		Date.now() - new Date(skill.registered_at).getTime() < freshPeriodDays * DAY_MS
	);
}
