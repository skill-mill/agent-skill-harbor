export function getSkillTitleTransitionName(skillKey: string): string {
	// view-transition-name は CSS 識別子として安全な文字列にしておく。
	const normalized = skillKey
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return `skill-title-${normalized || 'unknown'}`;
}

export const VIEW_TABS_TRANSITION_NAME = 'view-tabs';
