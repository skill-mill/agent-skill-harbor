<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import StarsBackground from '$lib/components/StarsBackground.svelte';
	import RippleBackground from '$lib/components/RippleBackground.svelte';
	import { Provider as TooltipProvider } from '$lib/components/ui/tooltip';
	import { initTheme } from '$lib/stores/theme';
	import { background, initBackground } from '$lib/stores/background';
	import { initLocale } from '$lib/i18n';
	import { setupViewTransition } from 'sveltekit-view-transition';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	setupViewTransition();

	onMount(() => {
		initTheme();
		initLocale();
		initBackground();
	});
</script>

{#snippet pageContent()}
	<div class="flex min-h-screen flex-col">
		<Header repoFullName={data.repoFullName} title={data.settings.ui.title} />
		<main class="flex-1">
			{@render children()}
		</main>
		<Footer />
	</div>
{/snippet}

<TooltipProvider delayDuration={700}>
	{#if $background === 'ripples'}
		<RippleBackground class="min-h-screen">
			{@render pageContent()}
		</RippleBackground>
	{:else if $background === 'stars'}
		<StarsBackground class="min-h-screen" speed={120} factor={0.025} damping={35}>
			{@render pageContent()}
		</StarsBackground>
	{:else}
		<div class="min-h-screen bg-white dark:bg-gray-950">
			{@render pageContent()}
		</div>
	{/if}
</TooltipProvider>
