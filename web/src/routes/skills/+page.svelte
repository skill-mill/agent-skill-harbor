<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import SkillList from '$lib/components/SkillList.svelte';
	import SkillTable from '$lib/components/SkillTable.svelte';
	import RepoTable from '$lib/components/RepoTable.svelte';
	import OriginTable from '$lib/components/OriginTable.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import ViewTabs from '$lib/components/ViewTabs.svelte';
	import type { ViewMode } from '$lib/components/ViewTabs.svelte';
	import type { FlatSkillEntry, PluginFilterOption, RepoInfo, UsagePolicy, Visibility } from '$lib/types';
	import { createSearchIndex, searchSkills } from '$lib/utils/search';
	import { filterSkills, type FilterState, type OrgOwnership } from '$lib/utils/filter';
	import { groupByOrigin } from '$lib/utils/origin';
	import { getResolvedFromRepoLabel } from '$lib/utils/resolved-from';
	import { t } from '$lib/i18n';

	type GroupMode = 'none' | 'repo' | 'origin';

	interface Props {
		data: {
			skills: FlatSkillEntry[];
			repos: RepoInfo[];
			freshPeriodDays: number;
			orgName: string;
			pluginFilterOptions?: PluginFilterOption[];
		};
	}

	let { data }: Props = $props();
	let allSkills = $derived(data.skills);
	let allRepos = $derived(data.repos);
	let freshPeriodDays = $derived(data.freshPeriodDays);
	let orgName = $derived(data.orgName);
	let searchIndex = $derived(createSearchIndex(allSkills));

	// Client-side state
	let query = $state('');
	let filters = $state<FilterState>({ status: null, visibility: null, orgOwnership: null, pluginLabels: {} });
	let view = $state<'card' | 'list'>('card');
	let groupMode = $state<GroupMode>('none');

	// Read initial state from URL on mount
	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		query = params.get('q') ?? '';
		const pluginLabels = Object.fromEntries(
			(data.pluginFilterOptions ?? [])
				.map((option) => [option.plugin_id, params.get(`plugin_${option.plugin_id}`)])
				.filter((entry): entry is [string, string] => Boolean(entry[1])),
		);
		filters = {
			status: (params.get('status') as UsagePolicy | null) ?? null,
			visibility: (params.get('visibility') as Visibility | null) ?? null,
			orgOwnership: (params.get('origin') as OrgOwnership | null) ?? null,
			pluginLabels,
		};
		const v = params.get('view');
		view = v === 'list' ? 'list' : 'card';
		if (view === 'list') {
			const g = params.get('group');
			groupMode = g === 'repo' ? 'repo' : g === 'flat' ? 'none' : 'origin';
		}
	});

	// Compute displayed skills
	let displayedSkills = $derived.by(() => {
		let result = query ? searchSkills(searchIndex, query) : allSkills;
		result = filterSkills(result, filters);
		return result;
	});

	let displayedRepos = $derived.by(() => {
		const matchedRepoKeys = new Set(displayedSkills.map((s) => s.repoKey));
		if (
			!query &&
			filters.status === null &&
			filters.visibility === null &&
			filters.orgOwnership === null &&
			Object.keys(filters.pluginLabels).length === 0
		) {
			return allRepos;
		}
		return allRepos.filter((r) => matchedRepoKeys.has(r.repoKey));
	});

	let pluginFilterOptions = $derived(data.pluginFilterOptions ?? []);
	let originBySkillKey = $derived.by(() =>
		Object.fromEntries(allSkills.map((skill) => [skill.key, getResolvedFromRepoLabel(skill) ?? ''])),
	);

	function updateUrl(
		newQuery: string,
		newFilters: FilterState,
		newView: 'card' | 'list' = view,
		newGroupMode: GroupMode = groupMode,
	) {
		if (!browser) return;
		const params = new URLSearchParams();
		if (newQuery) params.set('q', newQuery);
		if (newFilters.status) params.set('status', newFilters.status);
		if (newFilters.visibility) params.set('visibility', newFilters.visibility);
		if (newFilters.orgOwnership) params.set('origin', newFilters.orgOwnership);
		for (const [pluginId, label] of Object.entries(newFilters.pluginLabels)) {
			params.set(`plugin_${pluginId}`, label);
		}
		if (newView === 'list') params.set('view', 'list');
		if (newView === 'list' && newGroupMode === 'none') params.set('group', 'flat');
		if (newView === 'list' && newGroupMode === 'repo') params.set('group', 'repo');
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
		if (newView === 'graph' || newView === 'stats') return;
		view = newView;
		const newGroupMode: GroupMode = newView === 'card' ? 'none' : 'origin';
		groupMode = newGroupMode;
		updateUrl(query, filters, newView, newGroupMode);
	}

	function setGroupMode(mode: GroupMode) {
		groupMode = groupMode === mode ? 'none' : mode;
		updateUrl(query, filters, view, groupMode);
	}

	let hasFilters = $derived(
		query !== '' ||
			filters.status !== null ||
			filters.visibility !== null ||
			filters.orgOwnership !== null ||
			Object.keys(filters.pluginLabels).length > 0,
	);

	let originGroups = $derived.by(() => {
		if (view !== 'list' || groupMode !== 'origin') return [];
		return groupByOrigin(displayedSkills, allSkills, orgName);
	});
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{$t('catalog.pageTitle')}</title>
	<meta name="description" content={$t('catalog.pageDescription')} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<ViewTabs activeView={view} onchange={handleViewChange} />
		<div class="flex flex-wrap items-center gap-2">
			<span
				class="text-sm font-medium {view === 'card'
					? 'text-gray-400 dark:text-gray-600'
					: 'text-gray-700 dark:text-gray-300'}">{$t('grouping.label')}</span
			>
			{#each [{ mode: 'repo' as GroupMode, label: $t('grouping.byRepo') }, { mode: 'origin' as GroupMode, label: $t('grouping.byOrigin') }] as { mode, label }}
				<button
					onclick={() => setGroupMode(mode)}
					disabled={view === 'card'}
					class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {groupMode === mode &&
					view === 'list'
						? 'border-blue-300 bg-blue-100 text-blue-800 ring-1 ring-offset-1 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-offset-gray-950'
						: view === 'card'
							? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-600'
							: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}"
				>
					{label}
				</button>
			{/each}
		</div>
	</div>

	<div class="mb-6 space-y-4">
		<SearchBar value={query} onchange={handleSearch} />
		<div class="flex flex-wrap items-center gap-3">
			<FilterPanel {filters} {pluginFilterOptions} onchange={handleFilterChange} />
			<span class="tabular-nums text-sm text-gray-500 dark:text-gray-400 sm:ml-auto">
				{#if hasFilters}
					<span class="font-semibold text-gray-900 dark:text-gray-100">{displayedSkills.length}</span> / {allSkills.length}
					skills
				{:else}
					<span class="font-semibold text-gray-900 dark:text-gray-100">{allSkills.length}</span> skills
				{/if}
			</span>
		</div>
	</div>

	{#if view === 'list' && groupMode === 'origin'}
		<OriginTable groups={originGroups} {freshPeriodDays} />
	{:else if view === 'list' && groupMode === 'repo'}
		<RepoTable repos={displayedRepos} skills={displayedSkills} {freshPeriodDays} />
	{:else if view === 'list'}
		<SkillTable skills={displayedSkills} {pluginFilterOptions} {freshPeriodDays} {originBySkillKey} />
	{:else}
		<SkillList skills={displayedSkills} {freshPeriodDays} {originBySkillKey} />
	{/if}
</div>
