<script lang="ts">
	import type { PluginFilterOption, UsagePolicy, Visibility } from '$lib/types';
	import type { FilterState, OrgOwnership } from '$lib/utils/filter';
	import { t } from '$lib/i18n';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Select from '$lib/components/ui/select';

	interface Props {
		filters: FilterState;
		pluginFilterOptions?: PluginFilterOption[];
		onchange: (filters: FilterState) => void;
	}

	let { filters, pluginFilterOptions = [], onchange }: Props = $props();

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

	function onStatusChange(value: string | undefined) {
		onchange({ ...filters, status: value && value !== '__all__' ? (value as UsagePolicy) : null });
	}

	function onVisibilityChange(value: string | undefined) {
		onchange({ ...filters, visibility: value && value !== '__all__' ? (value as Visibility) : null });
	}

	function onOrgOwnershipChange(value: string | undefined) {
		onchange({ ...filters, orgOwnership: value && value !== '__all__' ? (value as OrgOwnership) : null });
	}

	function onPluginLabelChange(pluginId: string, value: string | undefined) {
		const pluginLabels = { ...filters.pluginLabels };
		if (!value || value === '__all__') {
			delete pluginLabels[pluginId];
		} else {
			pluginLabels[pluginId] = value;
		}
		onchange({ ...filters, pluginLabels });
	}

	let statusValue = $derived(filters.status ?? '__all__');
	let visibilityValue = $derived(filters.visibility ?? '__all__');
	let orgOwnershipValue = $derived(filters.orgOwnership ?? '__all__');
	let hasActiveFilters = $derived(
		filters.status !== null ||
			filters.visibility !== null ||
			filters.orgOwnership !== null ||
			Object.keys(filters.pluginLabels).length > 0,
	);

	function clearAll() {
		onchange({ status: null, visibility: null, orgOwnership: null, pluginLabels: {} });
	}
</script>

<div class="flex flex-wrap items-center gap-3">
	<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{$t('filter.label')}</span>

	<!-- Org ownership select -->
	<Select.Root type="single" value={orgOwnershipValue} onValueChange={onOrgOwnershipChange}>
		<Select.Trigger
			size="sm"
			class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.orgOwnership
				? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
				: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
		>
			{filters.orgOwnership
				? $t(orgOwnershipOptions.find((o) => o.value === filters.orgOwnership)?.labelKey ?? '')
				: $t('filter.allOwner')}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="__all__" label={$t('filter.all')} />
			{#each orgOwnershipOptions as opt}
				<Select.Item value={opt.value} label={$t(opt.labelKey)} />
			{/each}
		</Select.Content>
	</Select.Root>

	<!-- Visibility select -->
	<Select.Root type="single" value={visibilityValue} onValueChange={onVisibilityChange}>
		<Select.Trigger
			size="sm"
			class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.visibility
				? 'border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
				: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
		>
			{filters.visibility
				? $t(visibilityOptions.find((o) => o.value === filters.visibility)?.labelKey ?? '')
				: $t('filter.allVisibility')}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="__all__" label={$t('filter.all')} />
			{#each visibilityOptions as opt}
				<Select.Item value={opt.value} label={$t(opt.labelKey)} />
			{/each}
		</Select.Content>
	</Select.Root>

	<Select.Root type="single" value={statusValue} onValueChange={onStatusChange}>
		<Select.Trigger
			size="sm"
			class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.status
				? policyOptions.find((opt) => opt.value === filters.status)?.color
				: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
		>
			{filters.status ? $t(policyOptions.find((opt) => opt.value === filters.status)?.labelKey ?? '') : $t('filter.allStatus')}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="__all__" label={$t('filter.all')} />
			{#each policyOptions as opt}
				<Select.Item value={opt.value} label={$t(opt.labelKey)} />
			{/each}
		</Select.Content>
	</Select.Root>

	{#if pluginFilterOptions.length > 0}
		{#each pluginFilterOptions as option (option.plugin_id)}
			<Select.Root
				type="single"
				value={filters.pluginLabels[option.plugin_id] ?? '__all__'}
				onValueChange={(value) => onPluginLabelChange(option.plugin_id, value)}
			>
				<Select.Trigger
					size="sm"
					class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.pluginLabels[option.plugin_id]
						? 'border-gray-300 bg-gray-900 text-white dark:border-gray-500 dark:bg-gray-100 dark:text-gray-900'
						: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
				>
					{filters.pluginLabels[option.plugin_id] ?? option.short_label ?? option.plugin_id}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="__all__" label={$t('filter.all')} />
					{#each option.labels as label}
						<Select.Item value={label} {label} />
					{/each}
				</Select.Content>
			</Select.Root>
		{/each}
	{/if}

	{#if hasActiveFilters}
		<button
			onclick={clearAll}
			class="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
		>
			{$t('filter.clearAll')}
		</button>
	{/if}
</div>
