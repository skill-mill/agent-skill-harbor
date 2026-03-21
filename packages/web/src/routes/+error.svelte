<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>{page.status} - Agent Skill Harbor</title>
</svelte:head>

<div class="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center px-4 text-center">
	<p class="text-6xl font-bold text-gray-300 dark:text-gray-700">{page.status}</p>
	<h1 class="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
		{$t('error.title')}
	</h1>
	<p class="mt-2 text-gray-600 dark:text-gray-400">
		{$t('error.message')}
	</p>
	<a
		href="{base}/skills"
		class="mt-8 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
	>
		<ArrowLeft class="h-4 w-4" />
		{$t('error.backToCatalog')}
	</a>
</div>
