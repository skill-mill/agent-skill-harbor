<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import OwnerFilter from '../../components/OwnerFilter.svelte';

	const triggerClass =
		'rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';

	const { Story } = defineMeta({
		title: 'Components/Skills/OwnerFilter',
		component: OwnerFilter,
		args: {
			value: '__all__',
			triggerClass,
			onValueChange: () => {},
		},
	});
</script>

<script lang="ts">
	import type { OrgOwnership } from '$lib/utils/filter';
	import OwnerFilterComponent from '../../components/OwnerFilter.svelte';

	type OwnerValue = '__all__' | OrgOwnership;

	let value = $state<OwnerValue>('__all__');

	const triggerClass =
		'rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';
</script>

<Story name="Playground">
	{#snippet template()}
		<div class="space-y-3">
			<OwnerFilterComponent
				{value}
				{triggerClass}
				onValueChange={(next) => {
					value = (next as OwnerValue | undefined) ?? '__all__';
				}}
			/>
			<p class="text-sm text-gray-500 dark:text-gray-400">Selected value: {value}</p>
		</div>
	{/snippet}
</Story>
