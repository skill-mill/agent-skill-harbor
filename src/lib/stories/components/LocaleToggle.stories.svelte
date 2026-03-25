<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LocaleToggle from '../../components/LocaleToggle.svelte';

	const { Story } = defineMeta({
		title: 'Components/Skills/LocaleToggle',
		component: LocaleToggle,
	});
</script>

<Story name="Default" />
