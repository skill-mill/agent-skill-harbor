<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SearchBar from '../../components/SearchBar.svelte';

	const { Story } = defineMeta({
		title: 'Components/Skills/SearchBar',
		component: SearchBar,
		args: {
			value: '',
		},
	});
</script>

<script lang="ts">
	let interactiveValue = $state('');
</script>

<Story name="Empty" args={{ onchange: () => {} }} />
<Story name="Prefilled" args={{ value: 'slack', onchange: () => {} }} />

<Story name="Interactive">
	{#snippet template()}
		<div class="w-[320px] space-y-3">
			<SearchBar
				value={interactiveValue}
				onchange={(value) => {
					interactiveValue = value;
				}}
			/>
			<p class="text-sm text-gray-500 dark:text-gray-400">Current value: {interactiveValue || '(empty)'}</p>
		</div>
	{/snippet}
</Story>
