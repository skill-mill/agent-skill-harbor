<script lang="ts">
	import { base } from '$app/paths';
	import ConfigRawPanel from '$lib/components/ConfigRawPanel.svelte';
	import { t } from '$lib/i18n';
	import GovernanceBadge from '$lib/components/GovernanceBadge.svelte';
	import type { UsagePolicy } from '$lib/types';

	let { data } = $props();

	const skillKeys = $derived(new Set(data.skills.map((s) => s.key)));

	function shortSkillPath(fullPath: string): string {
		const parts = fullPath.split('/');
		if (parts.length >= 3 && parts[0] === 'github.com') {
			return parts.slice(1).join('/');
		}
		return fullPath;
	}
</script>

<ConfigRawPanel path="config/governance.yaml" content={data.rawConfigs.governance} />

<section>
	<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
		Governance Policies
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
							class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>{$t('settings.governance.policy')}</th
						>
						<th
							class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>{$t('settings.governance.note')}</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each Object.entries(data.governance.policies) as [skillPath, policy]}
						{@const exists = skillKeys.has(skillPath)}
						<tr class={exists ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'opacity-50'}>
							<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
								{#if exists}
									<a
										href="{base}/skills/{skillPath}"
										class="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
									>
										{shortSkillPath(skillPath)}
									</a>
								{:else}
									<span>{shortSkillPath(skillPath)}</span>
									<span
										class="ml-2 inline-block rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
									>
										{$t('settings.governance.not_found')}
									</span>
								{/if}
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
