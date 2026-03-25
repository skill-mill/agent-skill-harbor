<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThemeToggle from '../../components/ThemeToggle.svelte';

	const { Story } = defineMeta({
		title: 'Components/Skills/ThemeToggle',
		component: ThemeToggle,
	});
</script>

<Story name="Default" />
