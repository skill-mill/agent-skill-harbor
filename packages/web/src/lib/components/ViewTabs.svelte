<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';
	import Grid2x2 from '@lucide/svelte/icons/grid-2x2';
	import List from '@lucide/svelte/icons/list';
	import Network from '@lucide/svelte/icons/network';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';

	export type ViewMode = 'card' | 'list' | 'graph' | 'stats';

	interface Props {
		activeView: ViewMode;
		onchange?: (view: ViewMode) => void;
	}

	let { activeView, onchange }: Props = $props();

	const tabs: { key: ViewMode; icon: 'grid' | 'list' | 'graph' | 'stats' }[] = [
		{ key: 'stats', icon: 'stats' },
		{ key: 'card', icon: 'grid' },
		{ key: 'list', icon: 'list' },
		{ key: 'graph', icon: 'graph' },
	];

	function getFilterParams(): { owner?: string; visibility?: string } {
		const cur = new URLSearchParams(window.location.search);
		// skills page uses 'origin', stats page uses 'owner'
		const owner = cur.get('origin') ?? cur.get('owner') ?? undefined;
		const visibility = cur.get('visibility') ?? undefined;
		return { owner, visibility };
	}

	function handleTabClick(tab: ViewMode) {
		if (tab === activeView) return;
		if (!browser) return;

		const { owner, visibility } = getFilterParams();

		if (tab === 'stats') {
			const params = new URLSearchParams();
			if (owner && owner !== 'all') params.set('owner', owner);
			const search = params.toString();
			goto(`${base}/stats/${search ? '?' + search : ''}`);
			return;
		}

		if (tab === 'graph') {
			const params = new URLSearchParams();
			if (owner && owner !== 'all') params.set('owner', owner);
			const search = params.toString();
			goto(`${base}/graph/${search ? '?' + search : ''}`);
			return;
		}

		// Navigating to card or list
		const params = new URLSearchParams();
		if (tab === 'list') params.set('view', 'list');
		if (owner && owner !== 'all') params.set('origin', owner);
		if (visibility) params.set('visibility', visibility);
		const search = params.toString();

		if (activeView === 'graph' || activeView === 'stats') {
			goto(`${base}/skills/${search ? '?' + search : ''}`);
		} else {
			onchange?.(tab);
		}
	}
</script>

<div class="flex flex-wrap gap-x-1 gap-y-2 border-b border-gray-200 dark:border-gray-700" role="tablist">
	{#each tabs as tab (tab.key)}
		{@const isActive = activeView === tab.key}
		<button
			role="tab"
			aria-selected={isActive}
			onclick={() => handleTabClick(tab.key)}
			class="inline-flex min-w-fit items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2 text-sm font-medium transition-colors sm:px-4 {isActive
				? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
				: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'}"
		>
			{#if tab.icon === 'grid'}
				<Grid2x2 class="h-4 w-4" />
			{:else if tab.icon === 'list'}
				<List class="h-4 w-4" />
			{:else if tab.icon === 'graph'}
				<Network class="h-4 w-4" />
			{:else}
				<BarChart3 class="h-4 w-4" />
			{/if}
			{$t(`viewTabs.${tab.key}`)}
		</button>
	{/each}
</div>
