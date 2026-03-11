<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';

	export type ViewMode = 'card' | 'list' | 'graph';

	interface Props {
		activeView: ViewMode;
		onchange?: (view: ViewMode) => void;
	}

	let { activeView, onchange }: Props = $props();

	const tabs: { key: ViewMode; icon: 'grid' | 'list' | 'graph' }[] = [
		{ key: 'card', icon: 'grid' },
		{ key: 'list', icon: 'list' },
		{ key: 'graph', icon: 'graph' },
	];

	function handleTabClick(tab: ViewMode) {
		if (tab === activeView) return;
		if (!browser) return;

		if (tab === 'graph') {
			goto(`${base}/graph/`);
			return;
		}

		if (activeView === 'graph') {
			// Navigating from Graph page back to catalog
			const params = new URLSearchParams();
			if (tab === 'list') params.set('view', 'list');
			const search = params.toString();
			goto(`${base}/skills/${search ? '?' + search : ''}`);
		} else {
			onchange?.(tab);
		}
	}
</script>

<div class="flex gap-1 border-b border-gray-200 dark:border-gray-700" role="tablist">
	{#each tabs as tab (tab.key)}
		{@const isActive = activeView === tab.key}
		<button
			role="tab"
			aria-selected={isActive}
			onclick={() => handleTabClick(tab.key)}
			class="inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors {isActive
				? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
				: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'}"
		>
			{#if tab.icon === 'grid'}
				<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z"
						clip-rule="evenodd"
					/>
				</svg>
			{:else if tab.icon === 'list'}
				<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
						clip-rule="evenodd"
					/>
				</svg>
			{:else}
				<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 17v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z"
					/>
				</svg>
			{/if}
			{$t(`viewTabs.${tab.key}`)}
		</button>
	{/each}
</div>
