<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PillSelectFilter from '../../components/PillSelectFilter.svelte';

	const options = [
		{ value: '__all__', label: 'All owners' },
		{ value: 'org', label: 'Organization' },
		{ value: 'community', label: 'Community' },
	];

	const { Story } = defineMeta({
		title: 'Components/Skills/PillSelectFilter',
		component: PillSelectFilter,
		args: {
			value: '__all__',
			options,
			triggerLabel: 'All owners',
			triggerClass:
				'rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200',
			onValueChange: () => {},
		},
	});
</script>

<script lang="ts">
	import PillSelectFilterComponent from '../../components/PillSelectFilter.svelte';

	type OwnerValue = '__all__' | 'org' | 'community';

	let value = $state<OwnerValue>('__all__');

	const options = [
		{ value: '__all__', label: 'All owners' },
		{ value: 'org', label: 'Organization' },
		{ value: 'community', label: 'Community' },
	];

	const triggerClass =
		'rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';
</script>

<Story name="Playground">
	{#snippet template()}
		<div class="space-y-3">
			<PillSelectFilterComponent
				{value}
				{options}
				triggerLabel={options.find((option) => option.value === value)?.label ?? 'All owners'}
				{triggerClass}
				onValueChange={(next) => {
					value = (next as OwnerValue | undefined) ?? '__all__';
				}}
			/>
			<p class="text-sm text-gray-500 dark:text-gray-400">Selected value: {value}</p>
		</div>
	{/snippet}
</Story>
