<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { FlatSkillEntry, UsagePolicy } from '$lib/types';
	import type { OriginGroup } from '$lib/utils/origin';
	import GovernanceBadge from './GovernanceBadge.svelte';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';

	interface Props {
		groups: OriginGroup[];
		freshPeriodDays?: number;
	}

	let { groups, freshPeriodDays = 0 }: Props = $props();

	let expanded = new SvelteSet<string>();

	function toggleGroup(originKey: string) {
		if (expanded.has(originKey)) {
			expanded.delete(originKey);
		} else {
			expanded.add(originKey);
		}
	}

	function isNew(skill: FlatSkillEntry): boolean {
		return (
			freshPeriodDays > 0 &&
			!!skill.registered_at &&
			Date.now() - new Date(skill.registered_at).getTime() < freshPeriodDays * 86_400_000
		);
	}
</script>

{#if groups.length === 0}
	<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
		<p class="text-gray-500 dark:text-gray-400">{$t('skillList.empty')}</p>
	</div>
{:else}
	<div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
		<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
			<thead class="bg-gray-50 dark:bg-gray-800/50">
				<tr>
					<th class="w-8 px-2 py-3"></th>
					<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
						{$t('originTable.origin')}
					</th>
					<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
						{$t('originTable.skills')}
					</th>
					<th
						class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell"
					>
						{$t('originTable.unique')}
					</th>
					<th
						class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell"
					>
						{$t('originTable.owner')}
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
				{#each groups as group (group.originKey)}
					{@const isExpanded = expanded.has(group.originKey)}
					<tr
						class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
						onclick={() => toggleGroup(group.originKey)}
					>
						<td class="px-2 py-3 text-center text-gray-400 dark:text-gray-500">
							<svg
								class="inline-block h-3 w-3 transition-transform {isExpanded ? 'rotate-90' : ''}"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
									clip-rule="evenodd"
								/>
							</svg>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center gap-2">
								{#if group.isExternal}
									<a
										href="https://github.com/{group.originKey}"
										target="_blank"
										rel="noopener noreferrer"
										class="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
										onclick={(e) => e.stopPropagation()}
									>
										{group.originKey}
									</a>
								{:else}
									<span class="font-medium text-gray-900 dark:text-gray-100">
										{group.originKey}
									</span>
								{/if}
							</div>
						</td>
						<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
							{group.totalSkills}
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400 md:table-cell">
							{group.uniqueSkills}
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 text-sm lg:table-cell">
							{#if group.isExternal}
								<span
									class="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
								>
									{$t('skillCard.community')}
								</span>
							{:else}
								<span
									class="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
								>
									{group.originKey.split('/')[0]}
								</span>
							{/if}
						</td>
					</tr>
					{#if isExpanded}
						{#each group.rows as row (row.skillName)}
							{@const rowCount = (row.origin ? 1 : 0) + row.derivatives.length}
							<!-- Origin skill row -->
							<tr class="bg-gray-50/50 dark:bg-gray-800/30">
								<td class="px-2 py-2"></td>
								<td class="px-4 py-2">
									<div class="flex items-center gap-1.5 pl-4">
										{#if row.origin}
											<a
												href="{base}/skills/{row.origin.key}"
												class="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
											>
												{row.skillName}
											</a>
											{#if isNew(row.origin)}
												<span
													class="shrink-0 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
												>
													{$t('skillCard.new')}
												</span>
											{/if}
											<GovernanceBadge status={row.origin.usage_policy as UsagePolicy} />
										{:else}
											<span class="text-sm font-medium text-gray-900 dark:text-gray-100">
												{row.skillName}
											</span>
										{/if}
									</div>
								</td>
								<td class="whitespace-nowrap px-4 py-2 text-sm text-gray-400 dark:text-gray-500">
									{rowCount}
								</td>
								<td class="hidden px-4 py-2 md:table-cell"></td>
								<td class="hidden px-4 py-2 lg:table-cell"></td>
							</tr>
							<!-- Derivative skill rows -->
							{#each row.derivatives as derivative (derivative.key)}
								<tr class="bg-gray-50/30 dark:bg-gray-800/20">
									<td class="px-2 py-1"></td>
									<td class="px-4 py-1">
										<div class="flex items-center gap-1.5 pl-10">
											<span class="text-gray-300 dark:text-gray-600">&#x2514;</span>
											<a
												href="{base}/skills/{derivative.key}"
												class="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
											>
												{derivative.owner}/{derivative.repo}
											</a>
											{#if isNew(derivative)}
												<span
													class="shrink-0 inline-flex items-center rounded-full bg-emerald-100 px-1 py-0 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
												>
													{$t('skillCard.new')}
												</span>
											{/if}
											<GovernanceBadge status={derivative.usage_policy as UsagePolicy} />
										</div>
									</td>
									<td class="px-4 py-1"></td>
									<td class="hidden px-4 py-1 md:table-cell"></td>
									<td class="hidden px-4 py-1 lg:table-cell"></td>
								</tr>
							{/each}
						{/each}
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
{/if}
