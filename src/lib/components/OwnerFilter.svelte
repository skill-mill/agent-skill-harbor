<script lang="ts">
	import PillSelectFilter from '$lib/components/PillSelectFilter.svelte';
	import { t } from '$lib/i18n';
	import { OWNER_FILTER_TRANSITION_NAME } from '$lib/utils/view-transition';
	import type { OrgOwnership } from '$lib/utils/filter';

	interface Props {
		value: '__all__' | OrgOwnership;
		triggerClass: string;
		onValueChange: (value: string | undefined) => void;
		allLabel?: string;
		orgLabel?: string;
		communityLabel?: string;
	}

	let {
		value,
		triggerClass,
		onValueChange,
		allLabel = $t('filter.all'),
		orgLabel = $t('common.orgOwnership.org'),
		communityLabel = $t('common.orgOwnership.community'),
	}: Props = $props();

	let triggerLabel = $derived(value === '__all__' ? $t('filter.allOwner') : $t(`common.orgOwnership.${value}`));

	const options = $derived([
		{ value: '__all__', label: allLabel },
		{ value: 'org', label: orgLabel },
		{ value: 'community', label: communityLabel },
	]);
</script>

<PillSelectFilter
	{value}
	{triggerClass}
	{triggerLabel}
	{onValueChange}
	{options}
	transitionName={OWNER_FILTER_TRANSITION_NAME}
/>
