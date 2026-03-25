<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PluginLabelBadge from '../../components/PluginLabelBadge.svelte';

	const { Story } = defineMeta({
		title: 'Components/Skills/PluginLabelBadge',
		component: PluginLabelBadge,
		tags: ['test'],
		argTypes: {
			intent: {
				control: 'radio',
				options: ['neutral', 'success', 'info', 'warn', 'danger'],
			},
		},
		args: {
			label: 'neutral',
			intent: 'neutral',
		},
	});
</script>

<Story name="AllVariants">
	{#snippet template()}
		<div class="flex flex-wrap gap-3">
			<PluginLabelBadge label="neutral" intent="neutral" />
			<PluginLabelBadge label="success" intent="success" />
			<PluginLabelBadge label="info" intent="info" />
			<PluginLabelBadge label="warn" intent="warn" />
			<PluginLabelBadge label="danger" intent="danger" />
		</div>
	{/snippet}
</Story>

<Story name="Playground" />
