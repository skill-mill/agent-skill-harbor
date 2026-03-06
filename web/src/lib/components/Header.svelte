<script lang="ts">
	import { dev } from '$app/environment';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';
	import ThemeToggle from './ThemeToggle.svelte';
	import LocaleToggle from './LocaleToggle.svelte';

	interface Props {
		repoFullName?: string | null;
	}

	let { repoFullName = null }: Props = $props();

	let orgName = $derived(repoFullName?.split('/')[0] ?? null);
	let repoName = $derived(repoFullName?.split('/')[1] ?? null);
</script>

<header class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
		<a href="{base}/" class="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
			{#if dev}<span class="text-orange-500">(Dev)</span>{/if}
			{$t('header.title')}
		</a>
		<nav class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
			<a href="{base}/" class="transition-colors hover:text-gray-900 dark:hover:text-gray-100">{$t('header.catalog')}</a>
			<a href="{base}/docs/" class="transition-colors hover:text-gray-900 dark:hover:text-gray-100">{$t('docs.nav')}</a>
			{#if orgName}
				<span class="font-bold text-gray-900 dark:text-gray-100">
					<a href="https://github.com/{orgName}" target="_blank" rel="noopener noreferrer" class="hover:underline">{orgName}</a>
					{#if repoName}
						<span class="mx-0.5">/</span>
						<a href="https://github.com/{orgName}/{repoName}" target="_blank" rel="noopener noreferrer" class="hover:underline">{repoName}</a>
					{/if}
				</span>
			{/if}
			<LocaleToggle />
			<ThemeToggle />
		</nav>
	</div>
</header>
