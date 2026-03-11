<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';
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
		href="{base}/skills/"
		class="mt-8 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
	>
		<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
				clip-rule="evenodd"
			/>
		</svg>
		{$t('error.backToCatalog')}
	</a>
</div>
