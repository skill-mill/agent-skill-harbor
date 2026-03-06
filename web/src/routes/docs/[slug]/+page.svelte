<script lang="ts">
	import { dev } from '$app/environment';
	import { locale } from '$lib/i18n';
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';

	let { data } = $props();

	let html = $derived(
		DOMPurify.sanitize(marked(data.content[$locale] ?? data.content.en) as string)
	);
	let title = $derived(data.title[$locale] ?? data.title.en);
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{title} - Docs</title>
</svelte:head>

<h1 class="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
<div class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
	{@html html}
</div>
