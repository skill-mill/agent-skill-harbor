<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';

	let { children } = $props();

	const tabs = [
		{ id: 'harbor', href: `${base}/config/harbor` },
		{ id: 'governance', href: `${base}/config/governance` },
	] as const;
</script>

<svelte:head>
	<title>Config - {$t('header.title')}</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
		<nav class="-mb-px flex gap-6">
			{#each tabs as tab}
				{@const active = $page.url.pathname === tab.href}
				<a
					href={tab.href}
					class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors {active
						? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'}"
				>
					{tab.id}
				</a>
			{/each}
		</nav>
	</div>

	{@render children()}
</div>
