<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import PluginTrendChart from '$lib/components/PluginTrendChart.svelte';
	import TrendChart from '$lib/components/TrendChart.svelte';
	import ViewTabs from '$lib/components/ViewTabs.svelte';
	import GovernanceBadge from '$lib/components/GovernanceBadge.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type {
		CollectionEntry,
		FlatSkillEntry,
		PluginHistoryColumn,
		PluginHistorySummary,
		RepoInfo,
		UsagePolicy,
	} from '$lib/types';
	import { t, locale } from '$lib/i18n';
	import {
		buildAdoptionTrendData,
		buildSkillTrendData,
		getFilteredRepos,
		getHistoryRowMetrics,
		getRepoAdoptionPct,
		getRepoChange,
		getReposWithSkills,
		getSkillChange,
		getTotalFiles,
		getTotalRepos,
		matchesOwnerFilter,
		parseOwnerFilterValue,
		sumOwnerValues,
		type OwnerFilter,
	} from '$lib/utils/stats';

	interface Props {
		data: {
			skills: FlatSkillEntry[];
			repos: RepoInfo[];
			collections: CollectionEntry[];
			pluginHistoryColumns?: PluginHistoryColumn[];
			pluginHistorySummaries?: Record<string, PluginHistorySummary>;
		};
	}

	let { data }: Props = $props();

	// Filters
	let ownerFilterValue = $state('__all__');
	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const owner = params.get('owner');
		if (owner === 'org') ownerFilterValue = 'org';
		else if (owner === 'community') ownerFilterValue = 'community';
		else ownerFilterValue = '__all__';
	});

	function updateUrl() {
		if (!browser) return;
		const params = new URLSearchParams();
		if (ownerFilterValue === 'org') params.set('owner', 'org');
		else if (ownerFilterValue === 'community') params.set('owner', 'community');
		const search = params.toString();
		const pathname = window.location.pathname;
		goto(`${pathname}${search ? '?' + search : ''}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function onOwnerFilterChange(value: string | undefined) {
		ownerFilterValue = value ?? '__all__';
		updateUrl();
	}

	let ownerFilter = $derived(parseOwnerFilterValue(ownerFilterValue));

	// Filtered data
	let filteredSkills = $derived.by(() => {
		return data.skills.filter((skill) => matchesOwnerFilter(skill.isOrgOwned, ownerFilter));
	});

	let filteredRepos = $derived.by(() => {
		return getFilteredRepos(data.repos, ownerFilter);
	});

	let latest = $derived(data.collections[0] ?? null);
	let previous = $derived(data.collections[1] ?? null);

	// KPI values
	let totalSkills = $derived(filteredSkills.length);
	let totalRepos = $derived.by(() => {
		return getTotalRepos(latest, filteredRepos, ownerFilter);
	});
	let reposWithSkills = $derived.by(() => {
		return getReposWithSkills(latest, filteredRepos, ownerFilter);
	});
	let repoAdoptionPct = $derived(getRepoAdoptionPct(reposWithSkills, totalRepos));
	let totalFiles = $derived.by(() => {
		return getTotalFiles(latest, ownerFilter);
	});
	let skillChange = $derived.by(() => getSkillChange(totalSkills, previous, ownerFilter));
	let repoChange = $derived.by(() => {
		return getRepoChange(repoAdoptionPct, previous, ownerFilter);
	});

	let lastCollectedFormatted = $derived.by(() => {
		if (!latest) return '—';
		const d = new Date(latest.collecting.collected_at);
		return d.toLocaleDateString($locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	});

	// Trend chart data (oldest first)
	let trendData = $derived(buildSkillTrendData(data.collections, ownerFilter));

	// Adoption rate trend data (oldest first)
	let adoptionTrendData = $derived(buildAdoptionTrendData(data.collections, ownerFilter));

	// Breakdown
	let statusBreakdown = $derived.by(() => {
		const counts: Record<string, number> = { recommended: 0, discouraged: 0, prohibited: 0 };
		for (const s of filteredSkills) {
			if (s.usage_policy === 'none') continue;
			counts[s.usage_policy] = (counts[s.usage_policy] ?? 0) + 1;
		}
		return counts;
	});

	let visibilityBreakdown = $derived.by(() => {
		const counts: Record<string, number> = { public: 0, private: 0, internal: 0 };
		for (const s of filteredSkills) {
			counts[s.visibility] = (counts[s.visibility] ?? 0) + 1;
		}
		return counts;
	});

	let ownershipBreakdown = $derived.by(() => {
		let org = 0;
		let community = 0;
		for (const s of filteredSkills) {
			if (s.isOrgOwned) org++;
			else community++;
		}
		return { org, community };
	});

	let historyExpanded = $state(false);
	let displayedHistory = $derived(historyExpanded ? data.collections : data.collections.slice(0, 3));
	let pluginHistoryColumns = $derived(data.pluginHistoryColumns ?? []);
	let pluginHistorySummaries = $derived(data.pluginHistorySummaries ?? {});
	const trendShapes = ['circle', 'square', 'diamond', 'triangle', 'plus', 'ring', 'cross'] as const;

	function formatDuration(sec: number): string {
		if (sec >= 60) {
			const m = Math.floor(sec / 60);
			const s = sec % 60;
			return s > 0 ? `${m}m ${s}s` : `${m}m`;
		}
		return `${sec}s`;
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString($locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function formatPluginHistoryCell(entry: CollectionEntry, pluginId: string): string {
		return getPluginHistoryItems(entry, pluginId)
			.map((item) => `${item.abbreviation}:${item.count}`)
			.join(' ');
	}

	function getPluginHistoryTooltip(entry: CollectionEntry, pluginId: string): string {
		return getPluginHistoryItems(entry, pluginId)
			.map((item) => `${item.label}: ${item.count}`)
			.join('\n');
	}

	function getPluginHistoryItems(
		entry: CollectionEntry,
		pluginId: string,
	): Array<{
		label: string;
		abbreviation: string;
		count: number;
	}> {
		if (!entry.collect_id) return [];
		const pluginSummary = pluginHistorySummaries[entry.collect_id]?.[pluginId];
		const column = pluginHistoryColumns.find((item) => item.plugin_id === pluginId);
		if (!pluginSummary || !column) return [];

		return column.labels
			.map((label) => {
				const counts = pluginSummary[label] ?? { org: 0, community: 0 };
				const count =
					ownerFilter === 'org'
						? counts.org
						: ownerFilter === 'community'
							? counts.community
							: counts.org + counts.community;
				const shouldShowZero = column.intent_labels.includes(label);
				if (count <= 0 && !shouldShowZero) return null;
				return {
					label,
					abbreviation: column.label_abbreviations[label] ?? label,
					count,
				};
			})
			.filter((value): value is { label: string; abbreviation: string; count: number } => value != null);
	}

	function formatTrendDate(iso: string): string {
		const date = new Date(iso);
		return `${date.getMonth() + 1}/${date.getDate()}`;
	}

	function getHistoryMetrics(entry: CollectionEntry, previous: CollectionEntry | null) {
		return getHistoryRowMetrics(entry, previous, ownerFilter as OwnerFilter);
	}

	let pluginTrendSections = $derived.by(() =>
		pluginHistoryColumns.map((column) => {
			const labels = column.labels;
			const canChart = labels.length > 0 && labels.length <= 7;
			const series = canChart
				? labels.map((label, index) => ({
						label,
						intent: column.label_intents?.[label] ?? 'neutral',
						shape: trendShapes[index] ?? 'circle',
						points: [...data.collections].reverse().map((entry) => {
							const counts = entry.collect_id
								? (pluginHistorySummaries[entry.collect_id]?.[column.plugin_id]?.[label] ?? { org: 0, community: 0 })
								: { org: 0, community: 0 };
							const value =
								ownerFilter === 'org'
									? counts.org
									: ownerFilter === 'community'
										? counts.community
										: counts.org + counts.community;
							return { label: formatTrendDate(entry.collecting.collected_at), value };
						}),
					}))
				: [];
			return {
				...column,
				canChart,
				series,
			};
		}),
	);
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{$t('stats.pageTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<ViewTabs activeView="stats" />
		<div class="flex items-center gap-3">
			<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{$t('filter.label')}</span>

			<!-- Owner select -->
			<Select.Root type="single" value={ownerFilterValue} onValueChange={onOwnerFilterChange}>
				<Select.Trigger
					size="sm"
					class="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {ownerFilter
						? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
						: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
				>
					{ownerFilter ? $t(`common.orgOwnership.${ownerFilter}`) : $t('filter.allOwner')}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="__all__" label={$t('filter.all')} />
					<Select.Item value="org" label={$t('common.orgOwnership.org')} />
					<Select.Item value="community" label={$t('common.orgOwnership.community')} />
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- KPI Cards -->
	<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
		<StatCard label={$t('stats.totalSkills')} value={totalSkills} change={skillChange} />
		<StatCard
			label={$t('stats.totalRepos')}
			value="{repoAdoptionPct}%"
			sub="{reposWithSkills} / {totalRepos}"
			change={repoChange}
			changeSuffix="pt"
		/>
		<StatCard label={$t('stats.totalFiles')} value={totalFiles.toLocaleString()} />
		<StatCard label={$t('stats.lastCollected')} value={lastCollectedFormatted} />
	</div>

	<!-- Breakdown -->
	<div class="mb-8 grid gap-4 sm:grid-cols-3">
		<!-- By Status -->
		<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
			<h3 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{$t('stats.byStatus')}</h3>
			<dl class="space-y-2">
				{#each Object.entries(statusBreakdown) as [status, count]}
					<div class="flex items-center justify-between">
						<GovernanceBadge status={status as UsagePolicy} />
						<span class="tabular-nums text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
					</div>
				{/each}
			</dl>
		</div>

		<!-- By Visibility -->
		<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
			<h3 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{$t('stats.byVisibility')}</h3>
			<dl class="space-y-2">
				{#each Object.entries(visibilityBreakdown) as [vis, count]}
					{@const style =
						vis === 'public'
							? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
							: vis === 'internal'
								? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
								: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'}
					<div class="flex items-center justify-between">
						<span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {style}">
							{$t(`common.visibility.${vis}`)}
						</span>
						<span class="tabular-nums text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
					</div>
				{/each}
			</dl>
		</div>

		<!-- By Ownership -->
		<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
			<h3 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{$t('stats.byOwnership')}</h3>
			<dl class="space-y-2">
				<div class="flex items-center justify-between">
					<span
						class="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
					>
						{$t('common.orgOwnership.org')}
					</span>
					<span class="tabular-nums text-sm font-medium text-gray-900 dark:text-gray-100">
						{ownershipBreakdown.org}
					</span>
				</div>
				<div class="flex items-center justify-between">
					<span
						class="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
					>
						{$t('common.orgOwnership.community')}
					</span>
					<span class="tabular-nums text-sm font-medium text-gray-900 dark:text-gray-100">
						{ownershipBreakdown.community}
					</span>
				</div>
			</dl>
		</div>
	</div>

	<!-- Collection History Table -->
	<div class="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
		<div class="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
			<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">{$t('stats.collectHistory')}</h2>
		</div>
		{#if data.collections.length === 0}
			<div class="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
				{$t('stats.noHistory')}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead class="bg-gray-50 dark:bg-gray-800/50">
						<tr>
							<th
								class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								{$t('stats.date')}
							</th>
							<th
								class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								{$t('stats.totalSkills')}
							</th>
							<th
								class="hidden px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell"
							>
								{$t('stats.totalRepos')}
							</th>
							<th
								class="hidden px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell"
							>
								{$t('stats.totalFiles')}
							</th>
							<th
								class="hidden px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell"
							>
								{$t('stats.duration')}
							</th>
							{#each pluginHistoryColumns as column (column.plugin_id)}
								<th
									class="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell"
								>
									{column.short_label ?? column.plugin_id}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
						{#each displayedHistory as entry, i (entry.collect_id ?? entry.collecting.collected_at)}
							{@const prev = data.collections[i + 1]}
							{@const metrics = getHistoryMetrics(entry, prev)}
							<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
								<td class="whitespace-nowrap px-5 py-3 text-sm text-gray-900 dark:text-gray-100">
									{formatDate(entry.collecting.collected_at)}
								</td>
								<td class="whitespace-nowrap px-5 py-3 text-right text-sm">
									{#if metrics.skillDiff !== 0}
										<span
											class="mr-1 text-xs {metrics.skillDiff > 0
												? 'text-emerald-600 dark:text-emerald-400'
												: 'text-red-600 dark:text-red-400'}"
										>
											{metrics.skillDiff > 0 ? '+' : ''}{metrics.skillDiff}
										</span>
									{/if}
									<span class="tabular-nums font-medium text-gray-900 dark:text-gray-100">
										{metrics.stats.skills}
									</span>
								</td>
								<td class="hidden whitespace-nowrap px-5 py-3 text-right text-sm sm:table-cell">
									{#if metrics.repoDiff !== 0}
										<span
											class="mr-1 text-xs {metrics.repoDiff > 0
												? 'text-emerald-600 dark:text-emerald-400'
												: 'text-red-600 dark:text-red-400'}"
										>
											{metrics.repoDiff > 0 ? '+' : ''}{metrics.repoDiff}pt
										</span>
									{/if}
									<span class="tabular-nums font-medium text-gray-900 dark:text-gray-100">
										{metrics.adoptionPct}%
									</span>
									<span class="tabular-nums text-gray-400 dark:text-gray-500">
										({metrics.stats.repos_with_skills}/{metrics.stats.repos})
									</span>
								</td>
								<td
									class="hidden whitespace-nowrap px-5 py-3 text-right tabular-nums text-sm text-gray-500 dark:text-gray-400 md:table-cell"
								>
									{metrics.stats.files}
								</td>
								<td
									class="hidden whitespace-nowrap px-5 py-3 text-right tabular-nums text-sm text-gray-500 dark:text-gray-400 md:table-cell"
								>
									{formatDuration(entry.collecting.duration_sec)}
								</td>
								{#each pluginHistoryColumns as column (column.plugin_id)}
									{@const pluginCell = formatPluginHistoryCell(entry, column.plugin_id)}
									{@const pluginTooltip = getPluginHistoryTooltip(entry, column.plugin_id)}
									<td
										class="hidden whitespace-nowrap px-5 py-3 text-left tabular-nums text-sm text-gray-500 dark:text-gray-400 lg:table-cell"
									>
										{#if pluginCell}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<span class="cursor-help underline decoration-dotted underline-offset-2">
														{pluginCell}
													</span>
												</Tooltip.Trigger>
												<Tooltip.Content class="max-w-sm whitespace-pre-line text-sm">
													{pluginTooltip}
												</Tooltip.Content>
											</Tooltip.Root>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if data.collections.length > 10}
				<div class="border-t border-gray-200 px-5 py-3 text-center dark:border-gray-700">
					<button
						onclick={() => (historyExpanded = !historyExpanded)}
						class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
					>
						{historyExpanded ? 'Show less' : `Show all (${data.collections.length})`}
					</button>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Trend Chart -->
	{#if trendData.length > 0}
		<div class="mt-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
			<h2 class="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">{$t('stats.skillTrend')}</h2>
			<TrendChart data={trendData} secondaryData={adoptionTrendData} secondaryLabel="%" />
		</div>
	{/if}

	{#if pluginTrendSections.length > 0}
		<div class="mt-8 space-y-6">
			{#each pluginTrendSections as section (section.plugin_id)}
				<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
					<div class="mb-4">
						<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">
							{section.short_label ?? section.plugin_id}
						</h2>
					</div>
					{#if section.canChart}
						<PluginTrendChart series={section.series} />
					{:else}
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Too many labels to chart ({section.labels.length}).
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
