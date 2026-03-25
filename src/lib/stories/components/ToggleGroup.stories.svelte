<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { Component } from 'svelte';
	import Minus from '@lucide/svelte/icons/minus';
	import { CloudMoon, Sun } from '@jis3r/icons';
	import ToggleGroup from '../../components/ToggleGroup.svelte';

	type IconMode = 'light' | 'dark' | 'none';
	type LocaleMode = 'ja' | 'en';

	const iconItems = [
		{ value: 'light', label: 'Light', icon: Sun, animateIcon: true, iconSize: 17 },
		{ value: 'dark', label: 'Dark', icon: CloudMoon, animateIcon: true, iconSize: 17 },
		{ value: 'none', label: 'None', icon: Minus },
	] satisfies {
		value: IconMode;
		label: string;
		icon: Component<Record<string, unknown>>;
		animateIcon?: boolean;
		iconSize?: number;
	}[];

	const textItems = [
		{ value: 'ja', label: 'JA' },
		{ value: 'en', label: 'EN' },
	] satisfies {
		value: LocaleMode;
		label: string;
	}[];

	const { Story } = defineMeta({
		title: 'Components/Skills/ToggleGroup',
		component: ToggleGroup,
		args: {
			items: iconItems,
			selected: 'light',
			onSelect: () => {},
		},
	});
</script>

<Story name="AllVariants">
	{#snippet template()}
		<div class="space-y-4">
			<div class="space-y-2">
				<p class="text-sm text-gray-500 dark:text-gray-400">Icon mode</p>
				<ToggleGroup items={iconItems} selected="light" onSelect={() => {}} />
			</div>
			<div class="space-y-2">
				<p class="text-sm text-gray-500 dark:text-gray-400">Text mode</p>
				<ToggleGroup items={textItems} selected="ja" onSelect={() => {}} />
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Playground" />
