<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import TrendChart from '$lib/components/TrendChart.svelte';
	import ViewTabs from '$lib/components/ViewTabs.svelte';
	import GovernanceBadge from '$lib/components/GovernanceBadge.svelte';
	import * as Select from '$lib/components/ui/select';
	import type { CollectionEntry, FlatSkillEntry, RepoInfo, UsagePolicy } from '$lib/types';
	import { t, locale } from '$lib/i18n';

	interface Props {
		data: {
			skills: FlatSkillEntry[];
			repos: RepoInfo[];
			collections: CollectionEntry[];
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

	let ownerFilter = $derived(ownerFilterValue !== '__all__' ? ownerFilterValue : null);

	// Filtered data
	let filteredSkills = $derived.by(() => {
		if (!ownerFilter) return data.skills;
		return data.skills.filter((s) => (ownerFilter === 'org' ? s.isOrgOwned : !s.isOrgOwned));
	});

	let filteredRepos = $derived.by(() => {
		if (!ownerFilter) return data.repos;
		return data.repos.filter((r) => (ownerFilter === 'org' ? r.isOrgOwned : !r.isOrgOwned));
	});

	let latest = $derived(data.collections[0] ?? null);
	let previous = $derived(data.collections[1] ?? null);

	// KPI values
	let totalSkills = $derived(filteredSkills.length);
	let totalRepos = $derived.by(() => {
		if (!latest) return filteredRepos.length;
		if (ownerFilter === 'org') return latest.statistics.org.repos;
		if (ownerFilter === 'community') return latest.statistics.community.repos;
		return latest.statistics.org.repos + latest.statistics.community.repos;
	});
	let reposWithSkills = $derived.by(() => {
		if (!latest) return filteredRepos.filter((r) => r.skillCount > 0).length;
		if (ownerFilter === 'org') return latest.statistics.org.repos_with_skills;
		if (ownerFilter === 'community') return latest.statistics.community.repos_with_skills;
		return latest.statistics.org.repos_with_skills + latest.statistics.community.repos_with_skills;
	});
	let repoAdoptionPct = $derived(totalRepos > 0 ? Math.round((reposWithSkills / totalRepos) * 100) : 0);
	let totalFiles = $derived.by(() => {
		if (!latest) return 0;
		if (ownerFilter === 'org') return latest.statistics.org.files;
		if (ownerFilter === 'community') return latest.statistics.community.files;
		return latest.statistics.org.files + latest.statistics.community.files;
	});
	let skillChange = $derived.by(() => {
		if (!previous) return undefined;
		const prevSkills =
			ownerFilter === 'org'
				? previous.statistics.org.skills
				: ownerFilter === 'community'
					? previous.statistics.community.skills
					: previous.statistics.org.skills + previous.statistics.community.skills;
		return totalSkills - prevSkills;
	});
	let repoChange = $derived.by(() => {
		if (!previous) return undefined;
		const prevReposWithSkills =
			ownerFilter === 'org'
				? previous.statistics.org.repos_with_skills
				: ownerFilter === 'community'
					? previous.statistics.community.repos_with_skills
					: previous.statistics.org.repos_with_skills + previous.statistics.community.repos_with_skills;
		return reposWithSkills - prevReposWithSkills;
	});

	let lastCollectedFormatted = $derived.by(() => {
		if (!latest) return '—';
		const d = new Date(latest.collecting.collected_at);
		return d.toLocaleDateString($locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	});

	// Trend chart data (oldest first)
	let trendData = $derived.by(() => {
		const reversed = [...data.collections].reverse();
		return reversed.map((c) => {
			const d = new Date(c.collecting.collected_at);
			const value =
				ownerFilter === 'org'
					? c.statistics.org.skills
					: ownerFilter === 'community'
						? c.statistics.community.skills
						: c.statistics.org.skills + c.statistics.community.skills;
			return { label: `${d.getMonth() + 1}/${d.getDate()}`, value };
		});
	});

	// Adoption rate trend data (oldest first)
	let adoptionTrendData = $derived.by(() => {
		const reversed = [...data.collections].reverse();
		return reversed.map((c) => {
			const repos =
				ownerFilter === 'org'
					? c.statistics.org.repos
					: ownerFilter === 'community'
						? c.statistics.community.repos
						: c.statistics.org.repos + c.statistics.community.repos;
			const withSkills =
				ownerFilter === 'org'
					? c.statistics.org.repos_with_skills
					: ownerFilter === 'community'
						? c.statistics.community.repos_with_skills
						: c.statistics.org.repos_with_skills + c.statistics.community.repos_with_skills;
			return { label: '', value: repos > 0 ? Math.round((withSkills / repos) * 100) : 0 };
		});
	});

	// Breakdown
	let statusBreakdown = $derived.by(() => {
		const counts: Record<string, number> = { recommended: 0, discouraged: 0, prohibited: 0, none: 0 };
		for (const s of filteredSkills) {
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
	let displayedHistory = $derived(historyExpanded ? data.collections : data.collections.slice(0, 10));

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
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{$t('stats.pageTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6">
		<ViewTabs activeView="stats" />
	</div>

	<div class="mb-6 flex items-center gap-3">
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

	<!-- KPI Cards -->
	<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
		<StatCard label={$t('stats.totalSkills')} value={totalSkills} change={skillChange} />
		<StatCard
			label={$t('stats.totalRepos')}
			value="{reposWithSkills} / {totalRepos} ({repoAdoptionPct}%)"
			change={repoChange}
		/>
		<StatCard label={$t('stats.totalFiles')} value={totalFiles.toLocaleString()} />
		<StatCard label={$t('stats.lastCollected')} value={lastCollectedFormatted} />
	</div>

	<!-- Trend Chart -->
	{#if trendData.length > 0}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
			<h2 class="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">{$t('stats.skillTrend')}</h2>
			<TrendChart data={trendData} secondaryData={adoptionTrendData} secondaryLabel="%" />
		</div>
	{/if}

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
	<div class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
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
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
						{#each displayedHistory as entry, i (entry.collecting.collected_at)}
							{@const prev = data.collections[i + 1]}
							{@const s =
								ownerFilter === 'org'
									? entry.statistics.org
									: ownerFilter === 'community'
										? entry.statistics.community
										: {
												repos: entry.statistics.org.repos + entry.statistics.community.repos,
												repos_with_skills:
													entry.statistics.org.repos_with_skills + entry.statistics.community.repos_with_skills,
												skills: entry.statistics.org.skills + entry.statistics.community.skills,
												files: entry.statistics.org.files + entry.statistics.community.files,
											}}
							{@const ps = prev
								? ownerFilter === 'org'
									? prev.statistics.org
									: ownerFilter === 'community'
										? prev.statistics.community
										: {
												repos_with_skills:
													prev.statistics.org.repos_with_skills + prev.statistics.community.repos_with_skills,
												skills: prev.statistics.org.skills + prev.statistics.community.skills,
											}
								: null}
							{@const skillDiff = ps ? s.skills - ps.skills : 0}
							{@const repoDiff = ps ? s.repos_with_skills - ps.repos_with_skills : 0}
							<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
								<td class="whitespace-nowrap px-5 py-3 text-sm text-gray-900 dark:text-gray-100">
									{formatDate(entry.collecting.collected_at)}
								</td>
								<td class="whitespace-nowrap px-5 py-3 text-right text-sm">
									{#if skillDiff !== 0}
										<span
											class="mr-1 text-xs {skillDiff > 0
												? 'text-emerald-600 dark:text-emerald-400'
												: 'text-red-600 dark:text-red-400'}"
										>
											{skillDiff > 0 ? '+' : ''}{skillDiff}
										</span>
									{/if}
									<span class="tabular-nums font-medium text-gray-900 dark:text-gray-100">
										{s.skills}
									</span>
								</td>
								<td class="hidden whitespace-nowrap px-5 py-3 text-right text-sm sm:table-cell">
									{#if repoDiff !== 0}
										<span
											class="mr-1 text-xs {repoDiff > 0
												? 'text-emerald-600 dark:text-emerald-400'
												: 'text-red-600 dark:text-red-400'}"
										>
											{repoDiff > 0 ? '+' : ''}{repoDiff}
										</span>
									{/if}
									<span class="tabular-nums text-gray-500 dark:text-gray-400">
										{s.repos_with_skills} / {s.repos} ({s.repos > 0
											? Math.round((s.repos_with_skills / s.repos) * 100)
											: 0}%)
									</span>
								</td>
								<td
									class="hidden whitespace-nowrap px-5 py-3 text-right tabular-nums text-sm text-gray-500 dark:text-gray-400 md:table-cell"
								>
									{s.files}
								</td>
								<td
									class="hidden whitespace-nowrap px-5 py-3 text-right tabular-nums text-sm text-gray-500 dark:text-gray-400 md:table-cell"
								>
									{formatDuration(entry.collecting.duration_sec)}
								</td>
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
</div>
