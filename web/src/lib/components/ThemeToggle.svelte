<script lang="ts">
	import { theme, setTheme, type ThemeMode } from '$lib/stores/theme';
	import { t } from '$lib/i18n';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Monitor from '@lucide/svelte/icons/monitor';

	const modes: { mode: ThemeMode; labelKey: string }[] = [
		{ mode: 'light', labelKey: 'theme.light' },
		{ mode: 'dark', labelKey: 'theme.dark' },
		{ mode: 'system', labelKey: 'theme.system' },
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
			onclick={() => setTheme(mode)}
			class="rounded-md py-1 transition-all duration-200 {$theme === mode
				? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100 px-1.5'
				: expanded
					? 'px-1.5 text-gray-500 opacity-100 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
					: 'max-w-0 overflow-hidden px-0 opacity-0'}"
			title={$t(labelKey)}
			aria-label={$t(labelKey)}
		>
			{#if mode === 'light'}
				<Sun class="h-4 w-4" />
			{:else if mode === 'dark'}
				<Moon class="h-4 w-4" />
			{:else}
				<Monitor class="h-4 w-4" />
			{/if}
		</button>
	{/each}
</div>
