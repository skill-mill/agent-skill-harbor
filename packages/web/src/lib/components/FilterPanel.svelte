<script lang="ts">
	import type { LabelIntent, PluginFilterOption, UsagePolicy, Visibility } from '$lib/types';
	import { PLUGIN_NO_LABEL_VALUE, type FilterState, type OrgOwnership, type OriginPresence } from '$lib/utils/filter';
	import { t } from '$lib/i18n';
	import OwnerFilter from '$lib/components/OwnerFilter.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Select from '$lib/components/ui/select';

	interface Props {
		filters: FilterState;
		pluginFilterOptions?: PluginFilterOption[];
		optionCounts?: {
			status: Record<UsagePolicy, number>;
			visibility: Record<Visibility, number>;
			orgOwnership: Record<OrgOwnership, number>;
			hasOrigin: Record<OriginPresence, number>;
			pluginLabels: Record<string, Record<string, number>>;
		};
		onchange: (filters: FilterState) => void;
	}

	let {
		filters,
		pluginFilterOptions = [],
		optionCounts = {
			status: { recommended: 0, discouraged: 0, prohibited: 0, none: 0 },
			visibility: { public: 0, private: 0, internal: 0 },
			orgOwnership: { org: 0, community: 0 },
			hasOrigin: { yes: 0, no: 0 },
			pluginLabels: {},
		},
		onchange,
	}: Props = $props();

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

	const originOptions: { value: OriginPresence; labelKey: string }[] = [
		{ value: 'yes', labelKey: 'filter.originYes' },
		{ value: 'no', labelKey: 'filter.originNo' },
	];

	const NONE_LABEL = '(no label)';
	const pluginIntentClasses: Record<LabelIntent, string> = {
		neutral: 'border-gray-300 bg-gray-900 text-white dark:border-gray-500 dark:bg-gray-100 dark:text-gray-900',
		info: 'border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
		success:
			'border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300',
		warn: 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
		danger: 'border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300',
	};

	function onStatusChange(value: string | undefined) {
		onchange({ ...filters, status: value && value !== '__all__' ? (value as UsagePolicy) : null });
	}

	function onVisibilityChange(value: string | undefined) {
		onchange({ ...filters, visibility: value && value !== '__all__' ? (value as Visibility) : null });
	}

	function onOrgOwnershipChange(value: string | undefined) {
		onchange({ ...filters, orgOwnership: value && value !== '__all__' ? (value as OrgOwnership) : null });
	}

	function onOriginChange(value: string | undefined) {
		onchange({ ...filters, hasOrigin: value && value !== '__all__' ? (value as OriginPresence) : null });
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
	let orgOwnershipValue = $derived<'__all__' | OrgOwnership>(filters.orgOwnership ?? '__all__');
	let originValue = $derived(filters.hasOrigin ?? '__all__');
	let hasActiveFilters = $derived(
		filters.status !== null ||
			filters.visibility !== null ||
			filters.orgOwnership !== null ||
			filters.hasOrigin !== null ||
			Object.keys(filters.pluginLabels).length > 0,
	);

	function clearAll() {
		onchange({ status: null, visibility: null, orgOwnership: null, hasOrigin: null, pluginLabels: {} });
	}

	function getStatusLabel(value: UsagePolicy | null): string {
		if (value === 'none') return $t('governance.unclassified');
		return value ? $t(policyOptions.find((opt) => opt.value === value)?.labelKey ?? '') : $t('filter.allStatus');
	}

	function getPluginTriggerLabel(option: PluginFilterOption): string {
		const selected = filters.pluginLabels[option.plugin_id];
		if (selected === PLUGIN_NO_LABEL_VALUE) return NONE_LABEL;
		return selected ?? option.short_label ?? option.plugin_id;
	}

	function getPluginTriggerClass(option: PluginFilterOption): string {
		const selected = filters.pluginLabels[option.plugin_id];
		if (!selected) {
			return 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400';
		}
		if (selected === PLUGIN_NO_LABEL_VALUE) {
			return pluginIntentClasses.neutral;
		}
		return pluginIntentClasses[option.label_intents?.[selected] ?? 'neutral'];
	}

	function withCount(label: string, count: number | undefined): string {
		return `${label} (${count ?? 0})`;
	}
</script>

<div class="flex flex-wrap items-center gap-3">
	<!-- Org ownership select -->
	<OwnerFilter
		value={orgOwnershipValue}
		onValueChange={onOrgOwnershipChange}
		allLabel={$t('filter.all')}
		orgLabel={withCount($t('common.orgOwnership.org'), optionCounts.orgOwnership.org)}
		communityLabel={withCount($t('common.orgOwnership.community'), optionCounts.orgOwnership.community)}
		triggerClass="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.orgOwnership
			? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
			: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
	/>

	<Select.Root type="single" value={originValue} onValueChange={onOriginChange}>
		<Select.Trigger
			size="sm"
			class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.hasOrigin
				? 'border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
				: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
		>
			{filters.hasOrigin
				? $t(originOptions.find((o) => o.value === filters.hasOrigin)?.labelKey ?? '')
				: $t('filter.allOrigin')}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="__all__" label={$t('filter.all')} />
			{#each originOptions as opt}
				<Select.Item value={opt.value} label={withCount($t(opt.labelKey), optionCounts.hasOrigin[opt.value])} />
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
				<Select.Item value={opt.value} label={withCount($t(opt.labelKey), optionCounts.visibility[opt.value])} />
			{/each}
		</Select.Content>
	</Select.Root>

	<Select.Root type="single" value={statusValue} onValueChange={onStatusChange}>
		<Select.Trigger
			size="sm"
			class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {filters.status
				? filters.status === 'none'
					? 'border-gray-300 bg-gray-900 text-white dark:border-gray-500 dark:bg-gray-100 dark:text-gray-900'
					: policyOptions.find((opt) => opt.value === filters.status)?.color
				: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
		>
			{getStatusLabel(filters.status)}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="__all__" label={$t('filter.all')} />
			{#each policyOptions as opt}
				<Select.Item value={opt.value} label={withCount($t(opt.labelKey), optionCounts.status[opt.value])} />
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
					class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {getPluginTriggerClass(option)}"
				>
					{getPluginTriggerLabel(option)}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="__all__" label={$t('filter.all')} />
					{#each option.labels as label}
						<Select.Item value={label} label={withCount(label, option.counts?.[label])} />
					{/each}
					<Select.Item
						value={PLUGIN_NO_LABEL_VALUE}
						label={withCount(NONE_LABEL, option.counts?.[PLUGIN_NO_LABEL_VALUE])}
					/>
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
