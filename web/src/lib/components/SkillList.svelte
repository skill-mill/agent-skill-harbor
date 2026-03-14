<script lang="ts">
	import type { FlatSkillEntry } from '$lib/types';
	import { t } from '$lib/i18n';
	import SkillCard from './SkillCard.svelte';

	interface Props {
		skills: FlatSkillEntry[];
		freshPeriodDays?: number;
	}

	let { skills, freshPeriodDays = 0 }: Props = $props();
</script>

{#if skills.length === 0}
	<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
		<p class="text-gray-500 dark:text-gray-400">{$t('skillList.empty')}</p>
	</div>
{:else}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each skills as skill (skill.key)}
			<SkillCard {skill} {freshPeriodDays} />
		{/each}
	</div>
{/if}
