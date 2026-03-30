<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { VIEW_TABS_TRANSITION_NAME } from '$lib/utils/view-transition';
	import { setupViewTransition } from 'sveltekit-view-transition';
	import Grid2x2 from '@lucide/svelte/icons/grid-2x2';
	import List from '@lucide/svelte/icons/list';
	import Network from '@lucide/svelte/icons/network';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';

	export type ViewMode = 'card' | 'list' | 'graph' | 'stats' | 'findings';

	interface Props {
		activeView: ViewMode;
		onchange?: (view: ViewMode) => void;
		showBottomBorder?: boolean;
	}

	let { activeView, onchange, showBottomBorder = true }: Props = $props();
	const { transition: viewTransition } = setupViewTransition();

	const tabs: { key: ViewMode; icon: 'grid' | 'list' | 'graph' | 'stats' | 'findings'; label: string }[] = [
		{ key: 'card', icon: 'grid', label: 'Card' },
		{ key: 'list', icon: 'list', label: 'List' },
		{ key: 'findings', icon: 'findings', label: 'Findings' },
		{ key: 'stats', icon: 'stats', label: 'Stats' },
		{ key: 'graph', icon: 'graph', label: 'Graph' },
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

		if (tab === 'findings') {
			const params = new URLSearchParams();
			if (owner && owner !== 'all') params.set('owner', owner);
			const search = params.toString();
			goto(`${base}/findings/${search ? '?' + search : ''}`);
			return;
		}

		// Navigating to card or list
		const params = new URLSearchParams();
		if (tab === 'list') params.set('view', 'list');
		if (owner && owner !== 'all') params.set('origin', owner);
		if (visibility) params.set('visibility', visibility);
		const search = params.toString();

		if (activeView === 'graph' || activeView === 'stats' || activeView === 'findings') {
			goto(`${base}/skills/${search ? '?' + search : ''}`);
		} else {
			onchange?.(tab);
		}
	}
</script>

<div
	class="relative inline-flex w-fit flex-wrap gap-x-1 gap-y-2"
	role="tablist"
	use:viewTransition={{
		name: VIEW_TABS_TRANSITION_NAME,
		applyImmediately: true,
	}}
>
	{#if showBottomBorder}
		<span class="absolute bottom-0 left-1 right-1 h-px bg-gray-200 dark:bg-gray-700"></span>
	{/if}
	{#each tabs as tab (tab.key)}
		{@const isActive = activeView === tab.key}
		<button
			role="tab"
			aria-selected={isActive}
			onclick={() => handleTabClick(tab.key)}
			class="relative inline-flex min-w-fit items-center gap-1.5 whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors sm:px-4 {isActive
				? 'text-blue-600 dark:text-blue-400'
				: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
		>
			{#if tab.icon === 'grid'}
				<Grid2x2 class="h-4 w-4" />
			{:else if tab.icon === 'list'}
				<List class="h-4 w-4" />
			{:else if tab.icon === 'graph'}
				<Network class="h-4 w-4" />
			{:else if tab.icon === 'findings'}
				<CircleAlert class="h-4 w-4" />
			{:else}
				<BarChart3 class="h-4 w-4" />
			{/if}
			{tab.label}
			{#if isActive}
				<span class="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
			{/if}
		</button>
	{/each}
</div>
