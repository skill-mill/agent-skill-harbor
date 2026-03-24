<script lang="ts">
	import type { Component } from 'svelte';
	import { background, setBackground, type BackgroundMode } from '$lib/stores/background';
	import { t } from '$lib/i18n';
	import ToggleGroup from '$lib/components/ToggleGroup.svelte';
	import Minus from '@lucide/svelte/icons/minus';
	import { Ship, Sparkles } from '@jis3r/icons';

	const modes: {
		value: BackgroundMode;
		label: string;
		icon?: Component<Record<string, unknown>>;
		animateIcon?: boolean;
		iconSize?: number;
	}[] = [
		{
			value: 'ripples',
			label: 'background.ripples',
			icon: Ship,
			animateIcon: true,
			iconSize: 17,
		},
		{
			value: 'stars',
			label: 'background.stars',
			icon: Sparkles,
			animateIcon: true,
			iconSize: 17,
		},
		{ value: 'none', label: 'background.none', icon: Minus },
	];
</script>

<ToggleGroup
	items={modes.map(({ value, label, icon, animateIcon, iconSize }) => ({
		value,
		label: $t(label),
		icon,
		animateIcon,
		iconSize,
	}))}
	selected={$background}
	onSelect={setBackground}
/>
