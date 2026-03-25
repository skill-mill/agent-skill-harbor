<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StatCard from '../../components/StatCard.svelte';

	const { Story } = defineMeta({
		title: 'Components/Skills/StatCard',
		component: StatCard,
		args: {
			label: 'Total skills',
			value: 128,
		},
	});
</script>

<Story name="AllVariants">
	{#snippet template()}
		<div class="grid w-[720px] gap-4 md:grid-cols-3">
			<StatCard label="Total skills" value={128} />
			<StatCard label="Monthly growth" value={128} change={12} changeSuffix="%" sub="vs last month" />
			<StatCard label="Monthly decline" value={128} change={-4} sub="vs last month" />
		</div>
	{/snippet}
</Story>

<Story name="Playground" />
