<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import StarsBackground from '$lib/components/StarsBackground.svelte';
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
	<StarsBackground class="min-h-screen" speed={120} factor={0.025} damping={35}>
		<div class="flex min-h-screen flex-col">
			<Header repoFullName={data.repoFullName} title={data.settings.ui.title} />
			<main class="flex-1">
				{@render children()}
			</main>
			<Footer />
		</div>
	</StarsBackground>
</TooltipProvider>
