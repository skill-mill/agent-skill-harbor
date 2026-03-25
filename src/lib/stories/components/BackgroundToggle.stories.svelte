<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import BackgroundToggle from '../../components/BackgroundToggle.svelte';

	const { Story } = defineMeta({
		title: 'Components/Skills/BackgroundToggle',
		component: BackgroundToggle,
	});
</script>

<Story name="Default" />
