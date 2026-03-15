<script lang="ts">
	import type { FlatSkillEntry, UsagePolicy } from '$lib/types';
	import GovernanceBadge from './GovernanceBadge.svelte';
	import DriftStatusBadge from './DriftStatusBadge.svelte';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';

	interface Props {
		skill: FlatSkillEntry;
		freshPeriodDays?: number;
	}

	let { skill, freshPeriodDays = 0 }: Props = $props();

	let isNew = $derived(
		freshPeriodDays > 0 &&
			!!skill.registered_at &&
			Date.now() - new Date(skill.registered_at).getTime() < freshPeriodDays * 86_400_000,
	);

	let visibilityStyle = $derived(
		skill.visibility === 'public'
			? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
			: skill.visibility === 'internal'
				? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
				: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
	);

	let skillName = $derived(String(skill.frontmatter.name ?? skill.repo));
	let skillDescription = $derived(String(skill.frontmatter.description ?? ''));
	let metadata = $derived((skill.frontmatter.metadata ?? {}) as Record<string, unknown>);
</script>

<a
	href="{base}/skills/{skill.key}"
	class="block min-w-0 overflow-hidden rounded-lg border border-l-4 border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:shadow-gray-900/50 dark:hover:shadow-gray-900/80 {skill.isOrgOwned
		? 'border-l-blue-500 dark:border-l-blue-400'
		: 'border-l-transparent'}"
>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="min-w-0 flex-1">
			<h3 class="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
				{skillName}
			</h3>
			<p class="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
				{skillDescription}
			</p>
			{#if skill.excerpt}
				<p class="mt-1.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-500">
					{skill.excerpt}
				</p>
			{/if}
		</div>
		<div class="flex shrink-0 flex-row flex-wrap items-start gap-1.5 sm:flex-col sm:items-end">
			{#if isNew}
				<span
					class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
				>
					{$t('skillCard.new')}
				</span>
			{/if}
			<GovernanceBadge status={skill.usage_policy as UsagePolicy} />
			<DriftStatusBadge status={skill.drift_status} />
			<span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {visibilityStyle}">
				{skill.visibility}
			</span>
		</div>
	</div>

	<div class="mt-3 flex min-w-0 flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
		{#if skill.isOrgOwned}
			<span
				class="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 3.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zm3.5-3.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 3.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z"
						clip-rule="evenodd"
					/>
				</svg>
				{skill.owner}
			</span>
		{:else}
			<span
				class="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
					<path
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
					/>
				</svg>
				{$t('skillCard.community')}
			</span>
		{/if}
		<span class="min-w-0 break-all">{skill.owner}/{skill.repo}</span>
		{#if metadata.author}
			<span class="break-all">by {metadata.author}</span>
		{/if}
		{#if metadata.version}
			<span>v{metadata.version}</span>
		{/if}
	</div>
</a>
