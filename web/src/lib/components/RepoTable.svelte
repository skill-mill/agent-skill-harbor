<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { FlatSkillEntry, RepoInfo, UsagePolicy } from '$lib/types';
	import GovernanceBadge from './GovernanceBadge.svelte';
	import DriftStatusBadge from './DriftStatusBadge.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';

	interface Props {
		repos: RepoInfo[];
		skills: FlatSkillEntry[];
		freshPeriodDays?: number;
	}

	let { repos, skills, freshPeriodDays = 0 }: Props = $props();

	let expanded = new SvelteSet<string>();

	let skillsByRepo = $derived.by(() => {
		const map = new SvelteMap<string, FlatSkillEntry[]>();
		for (const skill of skills) {
			const list = map.get(skill.repoKey);
			if (list) {
				list.push(skill);
			} else {
				map.set(skill.repoKey, [skill]);
			}
		}
		return map;
	});

	function toggleRepo(repoKey: string) {
		if (expanded.has(repoKey)) {
			expanded.delete(repoKey);
		} else {
			expanded.add(repoKey);
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

{#if repos.length === 0}
	<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
		<p class="text-gray-500 dark:text-gray-400">{$t('repos.empty')}</p>
	</div>
{:else}
	<div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
		<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
			<thead class="bg-gray-50 dark:bg-gray-800/50">
				<tr>
					<th class="w-8 px-2 py-3"></th>
					<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
						{$t('repoTable.repository')}
					</th>
					<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
						{$t('repoTable.skills')}
					</th>
					<th
						class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell"
					>
						{$t('repoTable.visibility')}
					</th>
					<th
						class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell"
					>
						{$t('repoTable.owner')}
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
				{#each repos as repo (repo.repoKey)}
					{@const isExpanded = expanded.has(repo.repoKey)}
					{@const repoSkills = skillsByRepo.get(repo.repoKey) ?? []}
					{@const visibilityStyle =
						repo.visibility === 'public'
							? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
							: repo.visibility === 'internal'
								? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
								: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'}
					<tr
						class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
						onclick={() => toggleRepo(repo.repoKey)}
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
								<span class="font-medium text-gray-900 dark:text-gray-100">
									{repo.owner}/{repo.repo}
								</span>
								{#if repo.is_fork}
									<span
										class="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
									>
										Fork
									</span>
								{/if}
							</div>
						</td>
						<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
							{repo.skillCount}
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 md:table-cell">
							<span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {visibilityStyle}">
								{repo.visibility}
							</span>
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 text-sm lg:table-cell">
							{#if repo.isOrgOwned}
								<span
									class="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
								>
									{repo.owner}
								</span>
							{:else}
								<span
									class="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
								>
									{$t('skillCard.community')}
								</span>
							{/if}
						</td>
					</tr>
					{#if isExpanded}
						{#if repoSkills.length === 0}
							<tr>
								<td colspan="5" class="bg-gray-50/50 px-10 py-3 dark:bg-gray-800/30">
									<span class="text-sm text-gray-400 dark:text-gray-500">{$t('repos.noSkills')}</span>
								</td>
							</tr>
						{:else}
							{#each repoSkills as skill (skill.key)}
								{@const skillName = String(skill.frontmatter.name ?? skill.repo)}
								{@const skillDescription = String(skill.frontmatter.description ?? '')}
								<tr
									class="bg-gray-50/50 transition-colors hover:bg-gray-100/50 dark:bg-gray-800/30 dark:hover:bg-gray-800/50"
								>
									<td class="px-2 py-2"></td>
									<td class="px-4 py-2">
										<div class="flex items-center gap-1.5 pl-4">
											<a
												href="{base}/skills/{skill.key}"
												class="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
												onclick={(e) => e.stopPropagation()}
											>
												{skillName}
											</a>
											{#if isNew(skill)}
												<span
													class="shrink-0 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
												>
													{$t('skillCard.new')}
												</span>
											{/if}
											{#if skillDescription}
												<Tooltip.Root>
													<Tooltip.Trigger>
														{#snippet child({ props })}
															<span
																{...props}
																class="hidden max-w-xs truncate text-xs text-gray-400 dark:text-gray-500 md:inline"
															>
																— {skillDescription}
															</span>
														{/snippet}
													</Tooltip.Trigger>
													<Tooltip.Content class="max-w-sm text-sm">
														{skillDescription}
													</Tooltip.Content>
												</Tooltip.Root>
											{/if}
										</div>
									</td>
									<td class="whitespace-nowrap px-4 py-2">
										<div class="flex flex-wrap items-center gap-1.5">
											<GovernanceBadge status={skill.usage_policy as UsagePolicy} />
											<DriftStatusBadge status={skill.drift_status} />
										</div>
									</td>
									<td class="hidden px-4 py-2 md:table-cell"></td>
									<td class="hidden px-4 py-2 lg:table-cell"></td>
								</tr>
							{/each}
						{/if}
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
{/if}
