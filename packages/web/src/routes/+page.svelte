<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		void goto(`${base}/skills`, { replaceState: true });
	});
</script>

<svelte:head>
	<title>Agent Skill Harbor</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
	<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Agent Skill Harbor</h1>
	<p class="text-sm text-gray-600 dark:text-gray-400">
		Redirecting to the catalog. If it does not open automatically, choose a destination below.
	</p>
	<div class="flex flex-wrap justify-center gap-3">
		<a
			href="{base}/skills"
			class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
		>
			Open Skills
		</a>
		<a
			href="{base}/guide"
			class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
		>
			Open Guide
		</a>
	</div>
</div>
