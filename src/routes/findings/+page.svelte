<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import type { FindingEntry, RepoInfo, UsagePolicy } from '$lib/types';
	import type { SettingsConfig } from '$lib/schemas/settings';
	import OwnerFilter from '$lib/components/OwnerFilter.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import ViewTabs from '$lib/components/ViewTabs.svelte';
	import GovernanceBadge from '$lib/components/GovernanceBadge.svelte';
	import PluginLabelBadge from '$lib/components/PluginLabelBadge.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Info from '@lucide/svelte/icons/info';
	import { filterFindings, matchesFindingQuery } from '$lib/utils/findings';
	import { defaultFilterState, type FilterState, type OrgOwnership } from '$lib/utils/filter';
	import { getSkillTitleTransitionName } from '$lib/utils/view-transition';
	import { setupViewTransition } from 'sveltekit-view-transition';
	import { t } from '$lib/i18n';

	interface Props {
		data: {
			findings: FindingEntry[];
			skills: FindingEntry['skill'][];
			repos: RepoInfo[];
			settings: SettingsConfig;
		};
	}

	let { data }: Props = $props();
	const { transition: viewTransition } = setupViewTransition();

	let query = $state('');
	let ownerFilterValue = $state<'__all__' | OrgOwnership>('__all__');

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		query = params.get('q') ?? '';
		const owner = params.get('owner');
		if (owner === 'org') ownerFilterValue = 'org';
		else if (owner === 'community') ownerFilterValue = 'community';
		else ownerFilterValue = '__all__';
	});

	let filteredFindings = $derived.by(() => {
		const filters: FilterState = {
			...defaultFilterState,
			orgOwnership: ownerFilterValue === '__all__' ? null : ownerFilterValue,
		};
		let findings = filterFindings(data.findings, filters);
		if (query.trim()) {
			findings = findings.filter((finding) => matchesFindingQuery(finding, query));
		}
		return findings;
	});

	let ownerOptionCounts = $derived.by(() => {
		let org = 0;
		let community = 0;
		for (const finding of data.findings) {
			if (finding.skill.isOrgOwned) org++;
			else community++;
		}
		return { org, community };
	});
	let highlightIntents = $derived(data.settings.catalog.skill.highlight_intents);
	let highlightIntentsText = $derived(highlightIntents.join(', '));

	function updateUrl() {
		if (!browser) return;
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query);
		if (ownerFilterValue === 'org') params.set('owner', 'org');
		else if (ownerFilterValue === 'community') params.set('owner', 'community');
		const search = params.toString();
		goto(`${base}/findings${search ? `?${search}` : ''}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleSearch(value: string) {
		query = value;
		updateUrl();
	}

	function onOwnerFilterChange(value: string | undefined) {
		ownerFilterValue = (value ?? '__all__') as '__all__' | OrgOwnership;
		updateUrl();
	}
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{$t('findings.pageTitle')}</title>
	<meta name="description" content={$t('findings.pageDescription')} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6">
		<ViewTabs activeView="findings" />
	</div>

	<div class="mb-6">
		<div class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
			<p>{$t('findings.descriptionCurrent')}</p>
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<button
							type="button"
							{...props}
							class="inline-flex rounded text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
							aria-label={$t('findings.descriptionMore')}
						>
							<Info class="h-4 w-4" />
						</button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-72">
					<div class="space-y-2 text-sm leading-6 text-gray-700 dark:text-gray-200">
						<div class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Findings</div>
						<p>{$t('findings.descriptionDetail', { intents: highlightIntentsText })}</p>
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
		<div class="mt-4">
			<SearchBar value={query} onchange={handleSearch} />
		</div>
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<OwnerFilter
				value={ownerFilterValue}
				onValueChange={onOwnerFilterChange}
				allLabel={$t('filter.all')}
				orgLabel={`${$t('common.orgOwnership.org')} (${ownerOptionCounts.org})`}
				communityLabel={`${$t('common.orgOwnership.community')} (${ownerOptionCounts.community})`}
				triggerClass="h-7 rounded-full border px-3 py-1 text-xs font-medium shadow-none {ownerFilterValue !== '__all__'
					? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
					: 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
			/>
			<span class="tabular-nums text-sm text-gray-500 dark:text-gray-400 sm:ml-auto">
				<span class="font-semibold text-gray-900 dark:text-gray-100">{filteredFindings.length}</span> / {data.findings
					.length}
				{$t('findings.items')}
			</span>
		</div>
	</div>

	{#if filteredFindings.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
			<p class="text-gray-500 dark:text-gray-400">{$t('findings.empty')}</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
			<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
				<thead class="bg-gray-50 dark:bg-gray-800/50">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
						>
							{$t('findings.columns.finding')}
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
						>
							{$t('findings.columns.skill')}
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
						>
							{$t('findings.columns.repository')}
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
						>
							{$t('findings.columns.plugin')}
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
					{#each filteredFindings as finding (`${finding.skill.key}:${finding.plugin_id}:${finding.label}`)}
						<tr class="bg-red-100/70 transition-colors hover:bg-red-100/90 dark:bg-red-950/20 dark:hover:bg-red-950/35">
							<td class="max-w-xl px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
								<div class="mb-2">
									<PluginLabelBadge label={finding.label} intent={finding.intent} />
								</div>
								<div>
									<a
										href="{base}/skills/{finding.skill.key}#plugin-outputs"
										class="block rounded-sm transition-colors hover:text-blue-600 dark:hover:text-blue-400"
									>
										{#if finding.raw}
											<span class="line-clamp-3">{finding.raw}</span>
										{:else if finding.summary}
											<span class="line-clamp-3">{finding.summary}</span>
										{:else}
											<span class="text-gray-400 dark:text-gray-500">{$t('findings.noSummary')}</span>
										{/if}
									</a>
								</div>
							</td>
							<td class="max-w-[24rem] px-4 py-3">
								<div class="flex items-start gap-2">
									<a
										href="{base}/skills/{finding.skill.key}#plugin-outputs"
										class="mt-0.5 shrink-0 rounded text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
										aria-label={$t('findings.jumpToPluginOutputs')}
										title={$t('findings.jumpToPluginOutputs')}
									>
										<CircleAlert class="h-4 w-4" />
									</a>
									<div class="min-w-0">
										<a
											href="{base}/skills/{finding.skill.key}#plugin-outputs"
											class="block truncate font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
											use:viewTransition={{
												name: getSkillTitleTransitionName(finding.skill.key),
												applyImmediately: true,
											}}
										>
											{String(finding.skill.frontmatter.name ?? finding.skill.key)}
										</a>
										<div class="mt-2">
											<GovernanceBadge status={finding.skill.usage_policy as UsagePolicy} />
										</div>
									</div>
								</div>
							</td>
							<td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
								<div class="whitespace-nowrap">{finding.skill.owner}/{finding.skill.repo}</div>
								<div class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{finding.skill.skillPath}</div>
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
								{finding.plugin_short_label ?? finding.plugin_id}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
