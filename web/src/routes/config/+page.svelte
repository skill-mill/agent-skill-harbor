<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';
	import GovernanceBadge from '$lib/components/GovernanceBadge.svelte';
	import type { UsagePolicy } from '$lib/types';

	let { data } = $props();

	const tabs = ['harbor', 'governance'] as const;
	type Tab = (typeof tabs)[number];

	function getInitialTab(): Tab {
		if (!browser) return 'harbor';
		const param = new URLSearchParams(window.location.search).get('tab');
		return param === 'governance' ? 'governance' : 'harbor';
	}

	let activeTab = $state<Tab>(getInitialTab());

	function setTab(tab: Tab) {
		activeTab = tab;
		const url = new URL(window.location.href);
		url.searchParams.set('tab', tab);
		history.replaceState({}, '', url);
	}

	function shortSkillPath(fullPath: string): string {
		// "github.com/org/repo/.claude/skills/foo/SKILL.md" → "org/repo/.../foo/SKILL.md"
		const parts = fullPath.split('/');
		if (parts.length >= 3 && parts[0] === 'github.com') {
			return parts.slice(1).join('/');
		}
		return fullPath;
	}
</script>

<svelte:head>
	<title>Config - {$t('header.title')}</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Tabs -->
	<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
		<nav class="-mb-px flex gap-6">
			{#each tabs as tab}
				<button
					onclick={() => setTab(tab)}
					class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors {activeTab === tab
						? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'}"
				>
					{tab}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Harbor Tab -->
	{#if activeTab === 'harbor'}
		<div class="space-y-8">
			<!-- Collector Section -->
			<section>
				<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
					{$t('settings.collector.title')}
				</h2>
				<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
					<table class="w-full">
						<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
							<!-- exclude_forks -->
							<tr>
								<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
									{$t('settings.collector.exclude_forks')}
								</td>
								<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
									{#if data.settings.collector.exclude_forks}
										<span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
											<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
												<path
													fill-rule="evenodd"
													d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
													clip-rule="evenodd"
												/>
											</svg>
											{$t('settings.enabled')}
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
											<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
												<path
													d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
												/>
											</svg>
											{$t('settings.disabled')}
										</span>
									{/if}
								</td>
							</tr>
							<!-- include_origin_repos -->
							<tr>
								<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
									{$t('settings.collector.include_origin_repos')}
								</td>
								<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
									{#if data.settings.collector.include_origin_repos}
										<span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
											<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
												<path
													fill-rule="evenodd"
													d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
													clip-rule="evenodd"
												/>
											</svg>
											{$t('settings.enabled')}
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
											<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
												<path
													d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
												/>
											</svg>
											{$t('settings.disabled')}
										</span>
									{/if}
								</td>
							</tr>
							<!-- excluded_repos -->
							<tr>
								<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
									{$t('settings.collector.excluded_repos')}
								</td>
								<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
									{#if data.settings.collector.excluded_repos.length > 0}
										<ul class="list-inside list-disc space-y-0.5">
											{#each data.settings.collector.excluded_repos as repo}
												<li>
													{#if data.orgName}
														<a
															href="https://github.com/{data.orgName}/{repo}"
															target="_blank"
															rel="noopener noreferrer"
															class="text-blue-600 hover:underline dark:text-blue-400">{repo}</a
														>
													{:else}
														{repo}
													{/if}
												</li>
											{/each}
										</ul>
									{:else}
										<span class="text-gray-400 dark:text-gray-500">{$t('settings.empty_list')}</span>
									{/if}
								</td>
							</tr>
							<!-- included_extra_repos -->
							<tr>
								<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
									{$t('settings.collector.included_extra_repos')}
								</td>
								<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
									{#if data.settings.collector.included_extra_repos.length > 0}
										<ul class="list-inside list-disc space-y-0.5">
											{#each data.settings.collector.included_extra_repos as url}
												<li>
													{#if url.startsWith('https://') || url.startsWith('http://')}
														<a
															href={url}
															target="_blank"
															rel="noopener noreferrer"
															class="text-blue-600 hover:underline dark:text-blue-400">{url}</a
														>
													{:else}
														{url}
													{/if}
												</li>
											{/each}
										</ul>
									{:else}
										<span class="text-gray-400 dark:text-gray-500">{$t('settings.empty_list')}</span>
									{/if}
								</td>
							</tr>
							<!-- history_limit -->
							<tr>
								<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
									{$t('settings.collector.history_limit')}
								</td>
								<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
									{data.settings.collector.history_limit}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Catalog Section -->
			<section>
				<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
					{$t('settings.catalog.title')}
				</h2>
				<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
					<table class="w-full">
						<tbody>
							<tr>
								<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
									{$t('settings.catalog.fresh_period_days')}
								</td>
								<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
									{data.settings.catalog.skill.fresh_period_days}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</div>
	{/if}

	<!-- Governance Tab -->
	{#if activeTab === 'governance'}
		<section>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
				{$t('settings.governance.title')}
			</h2>
			{#if Object.keys(data.governance.policies).length > 0}
				<div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
								<th
									class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
									>{$t('settings.governance.skill_path')}</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
									>{$t('settings.governance.policy')}</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
									>{$t('settings.governance.note')}</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
							{#each Object.entries(data.governance.policies) as [skillPath, policy]}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
									<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
										<a
											href="{base}/skills/{skillPath}"
											class="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
										>
											{shortSkillPath(skillPath)}
										</a>
									</td>
									<td class="px-4 py-3 text-sm">
										<GovernanceBadge status={policy.usage_policy as UsagePolicy} />
									</td>
									<td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
										{policy.note ?? ''}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-400">
					{$t('settings.governance.empty')}
				</p>
			{/if}
		</section>
	{/if}
</div>
