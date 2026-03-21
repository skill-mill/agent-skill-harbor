<script lang="ts">
	import { t } from '$lib/i18n';
	import { highlightYamlLines } from '$lib/utils/yaml-highlight';

	interface Props {
		path: string;
		content: string | null;
	}

	let { path, content }: Props = $props();
	const highlightedLines = $derived(highlightYamlLines(content));
</script>

<details
	class="group mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40"
>
	<summary
		class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-700 marker:hidden hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/60"
	>
		<span>{$t('settings.raw.toggle')}</span>
		<svg
			class="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
				clip-rule="evenodd"
			/>
		</svg>
	</summary>
	<div class="border-t border-gray-200 px-4 py-4 dark:border-gray-700">
		{#if content}
			<code
				class="mb-3 block break-all rounded bg-gray-100 px-2 py-1.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
			>
				{path}
			</code>
			<pre class="overflow-x-auto rounded-md bg-gray-950 px-4 py-3 text-xs leading-6 text-gray-100"><code class="block"
					>{#each highlightedLines as line}<span class="block whitespace-pre">{@html line}</span>{/each}</code
				></pre>
		{:else}
			<p class="text-sm text-gray-500 dark:text-gray-400">{$t('settings.raw.empty')}</p>
		{/if}
	</div>
</details>
