<script lang="ts">
	import { dev } from '$app/environment';
	import { base } from '$app/paths';
	import { locale } from '$lib/i18n';
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';

	let { data } = $props();

	let html = $derived.by(() => {
		const rendered = marked(data.content[$locale] ?? data.content.en) as string;
		const withBase = rendered.replaceAll('href="/guide', `href="${base}/guide`);
		return DOMPurify.sanitize(withBase);
	});
	let title = $derived(data.title[$locale] ?? data.title.en);
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{title} - Guide</title>
</svelte:head>

<h1 class="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
<div class="guide-content prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
	{@html html}
</div>
