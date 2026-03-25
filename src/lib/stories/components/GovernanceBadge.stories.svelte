<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import GovernanceBadge from '../../components/GovernanceBadge.svelte';

	const { Story } = defineMeta({
		title: 'Components/Skills/GovernanceBadge',
		component: GovernanceBadge,
		argTypes: {
			status: {
				control: 'radio',
				options: ['recommended', 'discouraged', 'prohibited', 'none'],
			},
		},
		args: {
			status: 'recommended',
		},
	});
</script>

<Story name="AllVariants">
	{#snippet template()}
		<div class="flex flex-wrap gap-3">
			<GovernanceBadge status="recommended" />
			<GovernanceBadge status="discouraged" />
			<GovernanceBadge status="prohibited" />
		</div>
	{/snippet}
</Story>

<Story name="Playground" />
