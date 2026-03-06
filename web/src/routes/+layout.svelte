<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Provider as TooltipProvider } from '$lib/components/ui/tooltip';
	import { initTheme } from '$lib/stores/theme';
	import { initLocale } from '$lib/i18n';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	onMount(() => {
		initTheme();
		initLocale();
	});
</script>

<TooltipProvider delayDuration={700}>
	<div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
		<Header repoFullName={data.repoFullName} />
		<main class="flex-1">
			{@render children()}
		</main>
		<Footer />
	</div>
</TooltipProvider>
