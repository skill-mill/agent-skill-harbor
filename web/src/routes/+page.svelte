<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import SkillList from '$lib/components/SkillList.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import type { FlatCatalog, UsagePolicy, Visibility } from '$lib/types';
	import { createSearchIndex, searchSkills } from '$lib/utils/search';
	import { filterSkills, type FilterState, type OrgOwnership } from '$lib/utils/filter';
	import { t } from '$lib/i18n';

	interface Props {
		data: { catalog: FlatCatalog };
	}

	let { data }: Props = $props();
	let allSkills = $derived(data.catalog.skills);
	let freshPeriodDays = $derived(data.catalog.fresh_period_days ?? 0);
	let searchIndex = $derived(createSearchIndex(allSkills));

	// Client-side state
	let query = $state('');
	let filters = $state<FilterState>({ statuses: [], visibilities: [], orgOwnerships: [] });

	// Read initial state from URL on mount
	$effect(() => {
		if (browser) {
			const params = new URLSearchParams(window.location.search);
			query = params.get('q') ?? '';
			filters = {
				statuses: (params.get('status')?.split(',').filter(Boolean) ?? []) as UsagePolicy[],
				visibilities: (params.get('visibility')?.split(',').filter(Boolean) ?? []) as Visibility[],
				orgOwnerships: (params.get('origin')?.split(',').filter(Boolean) ?? []) as OrgOwnership[]
			};
		}
	});

	// Compute displayed skills
	let displayedSkills = $derived.by(() => {
		let result = query ? searchSkills(searchIndex, query) : allSkills;
		result = filterSkills(result, filters);
		return result;
	});

	function updateUrl(newQuery: string, newFilters: FilterState) {
		if (!browser) return;
		const params = new URLSearchParams();
		if (newQuery) params.set('q', newQuery);
		if (newFilters.statuses.length) params.set('status', newFilters.statuses.join(','));
		if (newFilters.visibilities.length) params.set('visibility', newFilters.visibilities.join(','));
		if (newFilters.orgOwnerships.length) params.set('origin', newFilters.orgOwnerships.join(','));
		const search = params.toString();
		goto(`${base}/${search ? '?' + search : ''}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleSearch(value: string) {
		query = value;
		updateUrl(value, filters);
	}

	function handleFilterChange(newFilters: FilterState) {
		filters = newFilters;
		updateUrl(query, newFilters);
	}

	let hasFilters = $derived(query !== '' || filters.statuses.length > 0 || filters.visibilities.length > 0 || filters.orgOwnerships.length > 0);
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{$t('catalog.pageTitle')}</title>
	<meta name="description" content={$t('catalog.pageDescription')} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">{$t('catalog.title')}</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">
			{$t('catalog.skillCount', { count: allSkills.length })}
		</p>
	</div>

	<div class="mb-6 space-y-4">
		<SearchBar value={query} onchange={handleSearch} />
		<FilterPanel {filters} onchange={handleFilterChange} />
	</div>

	{#if hasFilters}
		<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
			{$t('catalog.showing', { displayed: displayedSkills.length, total: allSkills.length })}
		</p>
	{/if}

	<SkillList skills={displayedSkills} {freshPeriodDays} />
</div>
