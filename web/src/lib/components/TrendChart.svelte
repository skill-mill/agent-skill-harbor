<script lang="ts">
	interface DataPoint {
		label: string;
		value: number;
	}

	interface Props {
		data: DataPoint[];
		secondaryData?: DataPoint[];
		secondaryLabel?: string;
		height?: number;
	}

	let { data, secondaryData, secondaryLabel = '%', height = 200 }: Props = $props();

	const padding = { top: 20, right: 50, bottom: 30, left: 50 };

	let chartWidth = $state(600);
	let containerEl: HTMLDivElement | undefined = $state();
	let hoveredIndex: number | null = $state(null);

	$effect(() => {
		if (!containerEl) return;
		const observer = new ResizeObserver((entries) => {
			chartWidth = entries[0].contentRect.width;
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	let hasSecondary = $derived(secondaryData && secondaryData.length === data.length);

	let computed = $derived.by(() => {
		if (data.length === 0) return null;

		const values = data.map((d) => d.value);
		const minVal = Math.min(...values);
		const maxVal = Math.max(...values);
		const range = maxVal - minVal || 1;

		const rightPad = hasSecondary ? padding.right : 20;
		const innerWidth = chartWidth - padding.left - rightPad;
		const innerHeight = height - padding.top - padding.bottom;

		const points = data.map((d, i) => {
			const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2);
			const y = padding.top + innerHeight - ((d.value - minVal) / range) * innerHeight;
			return { x, y, ...d };
		});

		const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

		const areaPath =
			linePath +
			` L${points[points.length - 1].x},${padding.top + innerHeight}` +
			` L${points[0].x},${padding.top + innerHeight} Z`;

		// Y-axis ticks (5 ticks)
		const tickCount = 5;
		const yTicks = Array.from({ length: tickCount }, (_, i) => {
			const val = minVal + (range * i) / (tickCount - 1);
			const y = padding.top + innerHeight - ((val - minVal) / range) * innerHeight;
			return { value: Math.round(val), y };
		});

		// X-axis labels (show up to 8 evenly spaced)
		const maxLabels = Math.min(8, data.length);
		const step = data.length > 1 ? Math.max(1, Math.floor((data.length - 1) / (maxLabels - 1))) : 1;
		const xLabels = points.filter((_, i) => i % step === 0 || i === data.length - 1);

		// Secondary axis (right)
		let secondary = null;
		if (hasSecondary && secondaryData) {
			const sValues = secondaryData.map((d) => d.value);
			const sMin = Math.min(...sValues);
			const sMax = Math.max(...sValues);
			const sRange = sMax - sMin || 1;

			const sPoints = secondaryData.map((d, i) => {
				const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2);
				const y = padding.top + innerHeight - ((d.value - sMin) / sRange) * innerHeight;
				return { x, y, ...d };
			});

			const sLinePath = sPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

			const sTicks = Array.from({ length: tickCount }, (_, i) => {
				const val = sMin + (sRange * i) / (tickCount - 1);
				const y = padding.top + innerHeight - ((val - sMin) / sRange) * innerHeight;
				return { value: Math.round(val), y };
			});

			secondary = { points: sPoints, linePath: sLinePath, yTicks: sTicks };
		}

		return { points, linePath, areaPath, yTicks, xLabels, innerHeight, rightPad, secondary };
	});
</script>

<div bind:this={containerEl} class="relative w-full">
	{#if computed && data.length > 1}
		<svg width={chartWidth} {height} class="overflow-visible">
			<!-- Y-axis grid lines -->
			{#each computed.yTicks as tick}
				<line
					x1={padding.left}
					y1={tick.y}
					x2={chartWidth - computed.rightPad}
					y2={tick.y}
					class="stroke-gray-200 dark:stroke-gray-700"
					stroke-width="1"
				/>
				<text
					x={padding.left - 8}
					y={tick.y}
					text-anchor="end"
					dominant-baseline="middle"
					class="fill-gray-400 text-xs dark:fill-gray-500"
				>
					{tick.value}
				</text>
			{/each}

			<!-- Secondary Y-axis ticks (right) -->
			{#if computed.secondary}
				{#each computed.secondary.yTicks as tick}
					<text
						x={chartWidth - computed.rightPad + 8}
						y={tick.y}
						text-anchor="start"
						dominant-baseline="middle"
						class="fill-amber-500 text-xs dark:fill-amber-400"
					>
						{tick.value}{secondaryLabel}
					</text>
				{/each}
			{/if}

			<!-- Area fill (primary) -->
			<path d={computed.areaPath} class="fill-blue-100/50 dark:fill-blue-900/20" />

			<!-- Line (primary) -->
			<path d={computed.linePath} fill="none" class="stroke-blue-500 dark:stroke-blue-400" stroke-width="2" />

			<!-- Data points (primary) -->
			{#each computed.points as point}
				<circle cx={point.x} cy={point.y} r="3" class="fill-blue-500 dark:fill-blue-400" />
			{/each}

			<!-- Secondary line -->
			{#if computed.secondary}
				<path
					d={computed.secondary.linePath}
					fill="none"
					class="stroke-amber-500 dark:stroke-amber-400"
					stroke-width="2"
					stroke-dasharray="6 3"
				/>
				{#each computed.secondary.points as point}
					<circle
						cx={point.x}
						cy={point.y}
						r="3"
						class="fill-white stroke-amber-500 dark:fill-gray-900 dark:stroke-amber-400"
						stroke-width="1.5"
					/>
				{/each}
			{/if}

			<!-- X-axis labels -->
			{#each computed.xLabels as point}
				<text
					x={point.x}
					y={padding.top + computed.innerHeight + 20}
					text-anchor="middle"
					class="fill-gray-400 text-xs dark:fill-gray-500"
				>
					{point.label}
				</text>
			{/each}

			<!-- Hover guide line -->
			{#if hoveredIndex != null}
				{@const hp = computed.points[hoveredIndex]}
				<line
					x1={hp.x}
					y1={padding.top}
					x2={hp.x}
					y2={padding.top + computed.innerHeight}
					class="stroke-gray-300 dark:stroke-gray-600"
					stroke-width="1"
					stroke-dasharray="4 2"
				/>
				<!-- Highlighted primary point -->
				<circle cx={hp.x} cy={hp.y} r="5" class="fill-blue-500 dark:fill-blue-400" opacity="0.8" />
				{#if computed.secondary}
					{@const sp = computed.secondary.points[hoveredIndex]}
					<circle
						cx={sp.x}
						cy={sp.y}
						r="5"
						class="fill-white stroke-amber-500 dark:fill-gray-900 dark:stroke-amber-400"
						stroke-width="2"
					/>
				{/if}
			{/if}

			<!-- Invisible hit areas -->
			{#each computed.points as point, i}
				{@const hitWidth = Math.max(20, chartWidth / data.length)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<rect
					x={point.x - hitWidth / 2}
					y={padding.top}
					width={hitWidth}
					height={computed.innerHeight}
					fill="transparent"
					onpointerenter={() => (hoveredIndex = i)}
					onpointerleave={() => (hoveredIndex = null)}
				/>
			{/each}
		</svg>

		<!-- HTML Tooltip -->
		{#if hoveredIndex != null && computed}
			{@const hp = computed.points[hoveredIndex]}
			{@const tooltipLeft = hp.x}
			{@const tooltipOnRight = tooltipLeft < chartWidth / 2}
			<div
				class="pointer-events-none absolute z-10 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md dark:border-gray-600 dark:bg-gray-800"
				style="top: {padding.top - 4}px; {tooltipOnRight
					? `left: ${tooltipLeft + 12}px`
					: `right: ${chartWidth - tooltipLeft + 12}px`};"
			>
				<div class="mb-1 font-medium text-gray-600 dark:text-gray-300">{hp.label}</div>
				<div class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
					<span class="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
					{hp.value}
				</div>
				{#if computed.secondary}
					{@const sp = computed.secondary.points[hoveredIndex]}
					<div class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
						<span class="inline-block h-2 w-2 rounded-full border border-amber-500 bg-white dark:bg-gray-800"></span>
						{sp.value}{secondaryLabel}
					</div>
				{/if}
			</div>
		{/if}
	{:else if data.length === 1}
		<div class="flex items-center justify-center" style="height: {height}px">
			<span class="text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{data[0].value}</span>
		</div>
	{:else}
		<div class="flex items-center justify-center text-gray-400 dark:text-gray-500" style="height: {height}px">
			No data
		</div>
	{/if}
</div>
