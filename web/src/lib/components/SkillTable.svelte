<script lang="ts">
	import type { FlatSkillEntry, UsagePolicy } from '$lib/types';
	import GovernanceBadge from './GovernanceBadge.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';

	interface Props {
		skills: FlatSkillEntry[];
		freshPeriodDays?: number;
	}

	let { skills, freshPeriodDays = 0 }: Props = $props();

	type SortKey = 'name' | 'status' | 'visibility' | 'owner' | 'repo';
	let sortKey = $state<SortKey | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	function getSortValue(skill: FlatSkillEntry, key: SortKey): string {
		switch (key) {
			case 'name':
				return String(skill.frontmatter.name ?? skill.repo).toLowerCase();
			case 'status':
				return skill.usage_policy;
			case 'visibility':
				return skill.visibility;
			case 'owner':
				return skill.isOrgOwned ? '0' : '1';
			case 'repo':
				return `${skill.owner}/${skill.repo}`.toLowerCase();
		}
	}

	let sortedSkills = $derived.by(() => {
		if (!sortKey) return skills;
		const key = sortKey;
		const dir = sortDir === 'asc' ? 1 : -1;
		return [...skills].sort((a, b) => {
			const va = getSortValue(a, key);
			const vb = getSortValue(b, key);
			return va < vb ? -dir : va > vb ? dir : 0;
		});
	});

	let columns = $derived([
		{ key: 'name' as SortKey, label: $t('skillTable.name'), sortable: true, hideClass: '' },
		{
			key: null as SortKey | null,
			label: $t('skillTable.description'),
			sortable: false,
			hideClass: 'hidden md:table-cell',
		},
		{ key: 'repo' as SortKey, label: $t('skillTable.repository'), sortable: true, hideClass: 'hidden md:table-cell' },
		{ key: 'status' as SortKey, label: $t('skillTable.status'), sortable: true, hideClass: '' },
		{
			key: 'visibility' as SortKey,
			label: $t('skillTable.visibility'),
			sortable: true,
			hideClass: 'hidden lg:table-cell',
		},
		{ key: 'owner' as SortKey, label: $t('skillTable.owner'), sortable: true, hideClass: 'hidden lg:table-cell' },
	]);

	function isNew(skill: FlatSkillEntry): boolean {
		return (
			freshPeriodDays > 0 &&
			!!skill.registered_at &&
			Date.now() - new Date(skill.registered_at).getTime() < freshPeriodDays * 86_400_000
		);
	}
</script>

{#if skills.length === 0}
	<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
		<p class="text-gray-500 dark:text-gray-400">{$t('skillList.empty')}</p>
	</div>
{:else}
	<div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
		<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
			<thead class="bg-gray-50 dark:bg-gray-800/50">
				<tr>
					{#each columns as col (col.label)}
						<th
							class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 {col.hideClass} {col.sortable
								? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300'
								: ''}"
							onclick={() => col.sortable && col.key && toggleSort(col.key)}
						>
							<span class="inline-flex items-center gap-1">
								{col.label}
								{#if col.sortable && sortKey === col.key}
									<svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
										{#if sortDir === 'asc'}
											<path
												fill-rule="evenodd"
												d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
												clip-rule="evenodd"
											/>
										{:else}
											<path
												fill-rule="evenodd"
												d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
												clip-rule="evenodd"
											/>
										{/if}
									</svg>
								{/if}
							</span>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
				{#each sortedSkills as skill (skill.key)}
					{@const skillName = String(skill.frontmatter.name ?? skill.repo)}
					{@const skillDescription = String(skill.frontmatter.description ?? '')}
					{@const visibilityStyle =
						skill.visibility === 'public'
							? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
							: skill.visibility === 'internal'
								? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
								: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'}
					<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
						<td class="max-w-[20rem] px-4 py-3">
							<div class="flex items-center gap-1.5">
								<a
									href="{base}/skills/{skill.key}/"
									class="truncate font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
									title={skillName}
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
							</div>
						</td>
						<td class="hidden max-w-xs px-4 py-3 text-sm text-gray-500 dark:text-gray-400 md:table-cell">
							{#if skillDescription}
								<Tooltip.Root>
									<Tooltip.Trigger>
										{#snippet child({ props })}
											<span {...props} class="block truncate">{skillDescription}</span>
										{/snippet}
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-sm text-sm">
										{skillDescription}
									</Tooltip.Content>
								</Tooltip.Root>
							{/if}
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400 md:table-cell">
							{skill.owner}/{skill.repo}
						</td>
						<td class="whitespace-nowrap px-4 py-3">
							<GovernanceBadge status={skill.usage_policy as UsagePolicy} />
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
							<span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {visibilityStyle}">
								{skill.visibility}
							</span>
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 text-sm lg:table-cell">
							{#if skill.isOrgOwned}
								<span
									class="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
								>
									{skill.owner}
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
				{/each}
			</tbody>
		</table>
	</div>
{/if}
