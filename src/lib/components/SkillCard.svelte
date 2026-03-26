<script lang="ts">
	import type { FlatSkillEntry, UsagePolicy } from '$lib/types';
	import GovernanceBadge from './GovernanceBadge.svelte';
	import PluginLabelBadge from './PluginLabelBadge.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';
	import { isSkillNew } from '$lib/utils/skills';
	import { getSkillTitleTransitionName } from '$lib/utils/view-transition';
	import { setupViewTransition } from 'sveltekit-view-transition';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Globe from '@lucide/svelte/icons/globe';

	interface Props {
		skill: FlatSkillEntry;
		freshPeriodDays?: number;
		origin?: string;
	}

	let { skill, freshPeriodDays = 0, origin }: Props = $props();

	let isNew = $derived(isSkillNew(skill, freshPeriodDays));

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
	let showOrigin = $derived(!!origin);
	const { transition: viewTransition } = setupViewTransition();
</script>

<a
	href="{base}/skills/{skill.key}"
	class="block min-w-0 overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/70 dark:border-gray-700/80 dark:bg-gray-900 dark:ring-white/8 dark:hover:border-gray-600 dark:hover:shadow-gray-950/80"
>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="min-w-0 flex-1">
			<h3 class="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
				<span
					use:viewTransition={{
						name: getSkillTitleTransitionName(skill.key),
						applyImmediately: true,
					}}
				>
					{skillName}
				</span>
			</h3>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<p {...props} class="mt-1 line-clamp-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
							{skillDescription}
						</p>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content class="max-w-md whitespace-pre-line text-sm leading-6">
					{skillDescription}
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
		<div class="flex shrink-0 flex-row flex-wrap items-start gap-1.5 sm:flex-col sm:items-end">
			{#if isNew}
				<span
					class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
				>
					{$t('skillCard.new')}
				</span>
			{/if}
			<span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {visibilityStyle}">
				{skill.visibility}
			</span>
			<GovernanceBadge status={skill.usage_policy as UsagePolicy} />
			{#if skill.plugin_labels}
				{#each skill.plugin_labels as pluginLabel (`${pluginLabel.plugin_id}:${pluginLabel.label}`)}
					<PluginLabelBadge label={pluginLabel.label} intent={pluginLabel.intent} />
				{/each}
			{/if}
		</div>
	</div>

	<div class="mt-3 flex min-w-0 flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
		{#if skill.isOrgOwned}
			<span
				class="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
			>
				<Building2 class="h-3.5 w-3.5" />
				{skill.owner}
			</span>
		{:else}
			<span
				class="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
			>
				<Globe class="h-3.5 w-3.5" />
				{$t('skillCard.community')}
			</span>
		{/if}
		<span class="min-w-0 break-all">{skill.owner}/{skill.repo}</span>
		{#if showOrigin}
			<span class="min-w-0 break-all">Origin: {origin}</span>
		{/if}
		{#if metadata.author}
			<span class="break-all">by {metadata.author}</span>
		{/if}
		{#if metadata.version}
			<span>v{metadata.version}</span>
		{/if}
	</div>
</a>
