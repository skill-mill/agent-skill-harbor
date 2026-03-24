<script lang="ts">
	import type { Component } from 'svelte';
	import { theme, setTheme, type ThemeMode } from '$lib/stores/theme';
	import { t } from '$lib/i18n';
	import ToggleGroup from '$lib/components/ToggleGroup.svelte';
	import Monitor from '@lucide/svelte/icons/monitor';
	import { CloudMoon, Sun } from '@jis3r/icons';

	const modes: {
		value: ThemeMode;
		label: string;
		icon: Component<Record<string, unknown>>;
		animateIcon?: boolean;
		iconSize?: number;
	}[] = [
		{ value: 'dark', label: 'theme.dark', icon: CloudMoon, animateIcon: true, iconSize: 17 },
		{ value: 'light', label: 'theme.light', icon: Sun, animateIcon: true, iconSize: 17 },
		{ value: 'system', label: 'theme.system', icon: Monitor },
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
	selected={$theme}
	onSelect={setTheme}
/>
