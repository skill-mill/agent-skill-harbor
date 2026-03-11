<script lang="ts">
	import type { UsagePolicy, Visibility } from '$lib/types';
	import type { FilterState, OrgOwnership } from '$lib/utils/filter';
	import { t } from '$lib/i18n';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Select from '$lib/components/ui/select';

	interface Props {
		filters: FilterState;
		onchange: (filters: FilterState) => void;
	}

	let { filters, onchange }: Props = $props();

	const policyOptions: { value: UsagePolicy; labelKey: string; tooltipKey: string; color: string }[] = [
		{
			value: 'recommended',
			labelKey: 'governance.recommended',
			tooltipKey: 'governance.recommendedTip',
			color:
				'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
		},
		{
			value: 'discouraged',
			labelKey: 'governance.discouraged',
			tooltipKey: 'governance.discouragedTip',
			color:
				'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
		},
		{
			value: 'prohibited',
			labelKey: 'governance.prohibited',
			tooltipKey: 'governance.prohibitedTip',
			color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
		},
		{
			value: 'none',
			labelKey: 'governance.unclassified',
			tooltipKey: 'governance.unclassifiedTip',
			color: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
		},
	];

	const visibilityOptions: { value: Visibility; labelKey: string }[] = [
		{ value: 'public', labelKey: 'common.visibility.public' },
		{ value: 'private', labelKey: 'common.visibility.private' },
		{ value: 'internal', labelKey: 'common.visibility.internal' },
	];

	const orgOwnershipOptions: { value: OrgOwnership; labelKey: string }[] = [
		{ value: 'org', labelKey: 'common.orgOwnership.org' },
		{ value: 'community', labelKey: 'common.orgOwnership.community' },
	];

	function toggleStatus(status: UsagePolicy) {
		const statuses = filters.statuses.includes(status)
			? filters.statuses.filter((s) => s !== status)
			: [...filters.statuses, status];
		onchange({ ...filters, statuses });
	}

	function onVisibilityChange(value: string | undefined) {
		const visibilities = value && value !== '__all__' ? [value as Visibility] : [];
		onchange({ ...filters, visibilities });
	}

	function onOrgOwnershipChange(value: string | undefined) {
		const orgOwnerships = value && value !== '__all__' ? [value as OrgOwnership] : [];
		onchange({ ...filters, orgOwnerships });
	}

	let visibilityValue = $derived(filters.visibilities[0] ?? '__all__');
	let orgOwnershipValue = $derived(filters.orgOwnerships[0] ?? '__all__');

	let hasActiveFilters = $derived(
		filters.statuses.length > 0 || filters.visibilities.length > 0 || filters.orgOwnerships.length > 0,
	);

	function clearAll() {
		onchange({ statuses: [], visibilities: [], orgOwnerships: [] });
	}
</script>

<div class="flex flex-wrap items-center gap-3">
	<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{$t('filter.label')}</span>

	<!-- Usage policy filters -->
	{#each policyOptions as opt}
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						onclick={() => toggleStatus(opt.value)}
						class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {filters.statuses.includes(
							opt.value,
						)
							? opt.color + ' ring-1 ring-offset-1 dark:ring-offset-gray-950'
							: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}"
					>
						{$t(opt.labelKey)}
					</button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{$t(opt.tooltipKey)}</Tooltip.Content>
		</Tooltip.Root>
	{/each}

	<span class="mx-1 text-gray-300 dark:text-gray-600">|</span>

	<!-- Visibility select -->
	<Select.Root type="single" value={visibilityValue} onValueChange={onVisibilityChange}>
		<Select.Trigger
			size="sm"
			class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.visibilities.length > 0
				? 'border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
				: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
		>
			{filters.visibilities.length > 0
				? $t(visibilityOptions.find((o) => o.value === filters.visibilities[0])?.labelKey ?? '')
				: $t('filter.allVisibility')}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="__all__" label={$t('filter.all')} />
			{#each visibilityOptions as opt}
				<Select.Item value={opt.value} label={$t(opt.labelKey)} />
			{/each}
		</Select.Content>
	</Select.Root>

	<!-- Org ownership select -->
	<Select.Root type="single" value={orgOwnershipValue} onValueChange={onOrgOwnershipChange}>
		<Select.Trigger
			size="sm"
			class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.orgOwnerships.length > 0
				? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
				: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
		>
			{filters.orgOwnerships.length > 0
				? $t(orgOwnershipOptions.find((o) => o.value === filters.orgOwnerships[0])?.labelKey ?? '')
				: $t('filter.allOwner')}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="__all__" label={$t('filter.all')} />
			{#each orgOwnershipOptions as opt}
				<Select.Item value={opt.value} label={$t(opt.labelKey)} />
			{/each}
		</Select.Content>
	</Select.Root>

	{#if hasActiveFilters}
		<button
			onclick={clearAll}
			class="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
		>
			{$t('filter.clearAll')}
		</button>
	{/if}
</div>
