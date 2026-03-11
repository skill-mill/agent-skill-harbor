<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import SkillList from '$lib/components/SkillList.svelte';
	import SkillTable from '$lib/components/SkillTable.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import ViewTabs from '$lib/components/ViewTabs.svelte';
	import type { ViewMode } from '$lib/components/ViewTabs.svelte';
	import type { FlatSkillEntry, UsagePolicy, Visibility } from '$lib/types';
	import { createSearchIndex, searchSkills } from '$lib/utils/search';
	import { filterSkills, type FilterState, type OrgOwnership } from '$lib/utils/filter';
	import { t } from '$lib/i18n';

	interface Props {
		data: { skills: FlatSkillEntry[]; freshPeriodDays: number };
	}

	let { data }: Props = $props();
	let allSkills = $derived(data.skills);
	let freshPeriodDays = $derived(data.freshPeriodDays);
	let searchIndex = $derived(createSearchIndex(allSkills));

	// Client-side state
	let query = $state('');
	let filters = $state<FilterState>({ statuses: [], visibilities: [], orgOwnerships: [] });
	let view = $state<'card' | 'list'>('card');

	// Read initial state from URL on mount
	$effect(() => {
		if (browser) {
			const params = new URLSearchParams(window.location.search);
			query = params.get('q') ?? '';
			filters = {
				statuses: (params.get('status')?.split(',').filter(Boolean) ?? []) as UsagePolicy[],
				visibilities: (params.get('visibility')?.split(',').filter(Boolean) ?? []) as Visibility[],
				orgOwnerships: (params.get('origin')?.split(',').filter(Boolean) ?? []) as OrgOwnership[],
			};
			const v = params.get('view');
			view = v === 'list' ? 'list' : 'card';
		}
	});

	// Compute displayed skills
	let displayedSkills = $derived.by(() => {
		let result = query ? searchSkills(searchIndex, query) : allSkills;
		result = filterSkills(result, filters);
		return result;
	});

	function updateUrl(newQuery: string, newFilters: FilterState, newView: 'card' | 'list' = view) {
		if (!browser) return;
		const params = new URLSearchParams();
		if (newQuery) params.set('q', newQuery);
		if (newFilters.statuses.length) params.set('status', newFilters.statuses.join(','));
		if (newFilters.visibilities.length) params.set('visibility', newFilters.visibilities.join(','));
		if (newFilters.orgOwnerships.length) params.set('origin', newFilters.orgOwnerships.join(','));
		if (newView === 'list') params.set('view', 'list');
		const search = params.toString();
		const pathname = window.location.pathname;
		goto(`${pathname}${search ? '?' + search : ''}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleSearch(value: string) {
		query = value;
		updateUrl(value, filters);
	}

	function handleFilterChange(newFilters: FilterState) {
		filters = newFilters;
		updateUrl(query, newFilters);
	}

	function handleViewChange(newView: ViewMode) {
		if (newView === 'graph') return;
		view = newView;
		updateUrl(query, filters, newView);
	}

	let hasFilters = $derived(
		query !== '' || filters.statuses.length > 0 || filters.visibilities.length > 0 || filters.orgOwnerships.length > 0,
	);
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{$t('catalog.pageTitle')}</title>
	<meta name="description" content={$t('catalog.pageDescription')} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6">
		<ViewTabs activeView={view} onchange={handleViewChange} />
	</div>

	<div class="mb-6 space-y-4">
		<SearchBar value={query} onchange={handleSearch} />
		<div class="flex items-center gap-3">
			<span class="w-24 shrink-0 tabular-nums text-sm text-gray-500 dark:text-gray-400">
				{#if hasFilters}
					{displayedSkills.length} / {allSkills.length}
				{:else}
					{allSkills.length} skills
				{/if}
			</span>
			<FilterPanel {filters} onchange={handleFilterChange} />
		</div>
	</div>

	{#if view === 'list'}
		<SkillTable skills={displayedSkills} {freshPeriodDays} />
	{:else}
		<SkillList skills={displayedSkills} {freshPeriodDays} />
	{/if}
</div>
