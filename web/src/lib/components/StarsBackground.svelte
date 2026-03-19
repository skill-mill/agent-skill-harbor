<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * Animated starfield background with mouse-tracking parallax.
	 * Ported from bundui.io/motion/backgrounds/stars (React + Framer Motion).
	 */

	let {
		factor = 0.05,
		speed = 50,
		stiffness = 50,
		damping = 20,
		class: className = '',
		children,
	} = $props();

	const STAR_LAYERS = [
		{ count: 700, size: 1, speedMultiplier: 1 },
		{ count: 250, size: 2, speedMultiplier: 2.5 },
		{ count: 120, size: 3, speedMultiplier: 5 },
	];

	const FIELD_SIZE = 2000;

	const LIGHT_STYLES = {
		starDark: '#fff',
		starLight: '#000',
		bgStartDark: '#262626',
		bgEndDark: '#000',
		bgStartLight: '#ccc',
		bgEndLight: '#fff',
	};

	let isLight = $state(false);
	let layerShadows = $state(STAR_LAYERS.map(() => ''));

	// Spring-based parallax offset
	let targetX = $state(0);
	let targetY = $state(0);
	let springX = $state(0);
	let springY = $state(0);

	function generateStars(count: number, starColor: string): string {
		const shadows: string[] = [];
		for (let i = 0; i < count; i++) {
			const x = Math.floor(Math.random() * FIELD_SIZE * 2) - FIELD_SIZE;
			const y = Math.floor(Math.random() * FIELD_SIZE * 2) - FIELD_SIZE;
			shadows.push(`${x}px ${y}px ${starColor}`);
		}
		return shadows.join(', ');
	}

	function regenerateStars() {
		const color = isLight ? LIGHT_STYLES.starLight : LIGHT_STYLES.starDark;
		layerShadows = STAR_LAYERS.map((layer) => generateStars(layer.count, color));
	}

	function handleMouseMove(e: MouseEvent) {
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;
		targetX = -(e.clientX - centerX) * factor;
		targetY = -(e.clientY - centerY) * factor;
	}

	let bgStyle = $derived.by(() => {
		const start = isLight ? LIGHT_STYLES.bgStartLight : LIGHT_STYLES.bgStartDark;
		const end = isLight ? LIGHT_STYLES.bgEndLight : LIGHT_STYLES.bgEndDark;
		return `radial-gradient(ellipse at bottom, ${start} 0%, ${end} 100%)`;
	});

	onMount(() => {
		// Theme detection via MutationObserver (matches dark class toggle)
		function checkTheme() {
			isLight = !document.documentElement.classList.contains('dark');
		}
		checkTheme();

		const observer = new MutationObserver(checkTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});

		// Spring physics loop
		let animationId: number;
		let lastTime = performance.now();

		function tick(now: number) {
			const dt = Math.min((now - lastTime) / 1000, 0.064); // cap at ~15fps min
			lastTime = now;

			// Critically-damped spring approximation
			const dx = targetX - springX;
			const dy = targetY - springY;
			const spring = 1 - Math.exp(-stiffness * dt / damping);
			springX += dx * spring;
			springY += dy * spring;

			animationId = requestAnimationFrame(tick);
		}
		animationId = requestAnimationFrame(tick);

		return () => {
			observer.disconnect();
			cancelAnimationFrame(animationId);
		};
	});

	$effect(() => {
		// Re-generate stars when theme changes
		isLight;
		regenerateStars();
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative size-full overflow-hidden {className}"
	style:background={bgStyle}
	onmousemove={handleMouseMove}
>
	<div
		class="stars-parallax-wrapper"
		style:transform="translate({springX}px, {springY}px)"
	>
		{#each STAR_LAYERS as layer, i}
			{@const duration = speed * layer.speedMultiplier}
			<div
				class="stars-layer"
				style:--stars-duration="{duration}s"
			>
				<div
					class="stars-field"
					style:width="{layer.size}px"
					style:height="{layer.size}px"
					style:box-shadow={layerShadows[i]}
				></div>
				<div
					class="stars-field stars-field-clone"
					style:width="{layer.size}px"
					style:height="{layer.size}px"
					style:box-shadow={layerShadows[i]}
				></div>
			</div>
		{/each}
	</div>
	{#if children}
		<div class="relative z-10">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.stars-parallax-wrapper {
		will-change: transform;
	}

	.stars-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 2000px;
		animation: stars-scroll var(--stars-duration) linear infinite;
	}

	.stars-field {
		position: absolute;
		border-radius: 9999px;
		background: transparent;
	}

	.stars-field-clone {
		top: 2000px;
	}

	@keyframes stars-scroll {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(-2000px);
		}
	}
</style>
