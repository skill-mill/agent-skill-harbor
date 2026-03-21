<script lang="ts">
	import { background, setBackground, type BackgroundMode } from '$lib/stores/background';
	import { t } from '$lib/i18n';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Droplets from '@lucide/svelte/icons/droplets';
	import Minus from '@lucide/svelte/icons/minus';

	const modes: { mode: BackgroundMode; labelKey: string }[] = [
		{ mode: 'none', labelKey: 'background.none' },
		{ mode: 'stars', labelKey: 'background.stars' },
		{ mode: 'ripples', labelKey: 'background.ripples' },
	];

	let expanded = $state(false);
	let hideTimeout: ReturnType<typeof setTimeout>;

	function show() {
		clearTimeout(hideTimeout);
		expanded = true;
	}

	function hide() {
		hideTimeout = setTimeout(() => {
			expanded = false;
		}, 0);
	}
</script>

<div
	role="group"
	onmouseenter={show}
	onmouseleave={hide}
	onfocusin={show}
	onfocusout={hide}
	class="flex items-center rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800"
>
	{#each modes as { mode, labelKey }}
		<button
			onclick={() => setBackground(mode)}
			class="rounded-md py-1 transition-all duration-200 {$background === mode
				? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100 px-1.5'
				: expanded
					? 'px-1.5 text-gray-500 opacity-100 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
					: 'max-w-0 overflow-hidden px-0 opacity-0'}"
			title={$t(labelKey)}
			aria-label={$t(labelKey)}
		>
			{#if mode === 'none'}
				<Minus class="h-4 w-4" />
			{:else if mode === 'stars'}
				<Sparkles class="h-4 w-4" />
			{:else}
				<Droplets class="h-4 w-4" />
			{/if}
		</button>
	{/each}
</div>
