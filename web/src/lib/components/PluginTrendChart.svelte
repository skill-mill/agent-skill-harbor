<script lang="ts">
	import type { LabelIntent } from '$lib/types';

	interface TrendPoint {
		label: string;
		value: number;
	}

	interface TrendSeries {
		label: string;
		intent: LabelIntent;
		shape: 'circle' | 'square' | 'diamond' | 'triangle' | 'plus' | 'ring' | 'cross';
		points: TrendPoint[];
	}

	interface Props {
		series: TrendSeries[];
		height?: number;
	}

	let { series, height = 220 }: Props = $props();

	const padding = { top: 20, right: 20, bottom: 34, left: 40 };
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

	const intentColors: Record<LabelIntent, string> = {
		neutral: '#6b7280',
		info: '#2563eb',
		success: '#059669',
		warn: '#d97706',
		danger: '#dc2626',
	};

	let computed = $derived.by(() => {
		if (series.length === 0 || series[0].points.length === 0) return null;

		const values = series.flatMap((item) => item.points.map((point) => point.value));
		const maxVal = Math.max(...values, 0);
		const minVal = 0;
		const range = Math.max(maxVal - minVal, 1);
		const innerWidth = chartWidth - padding.left - padding.right;
		const innerHeight = height - padding.top - padding.bottom;
		const pointCount = series[0].points.length;

		const yTicks = Array.from({ length: 5 }, (_, index) => {
			const value = Math.round(minVal + (range * index) / 4);
			const y = padding.top + innerHeight - ((value - minVal) / range) * innerHeight;
			return { value, y };
		});

		const plottedSeries = series.map((item) => {
			const points = item.points.map((point, index) => {
				const x =
					padding.left + (pointCount > 1 ? (index / (pointCount - 1)) * innerWidth : innerWidth / 2);
				const y = padding.top + innerHeight - ((point.value - minVal) / range) * innerHeight;
				return { ...point, x, y };
			});
			return {
				...item,
				color: intentColors[item.intent],
				linePath: points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' '),
				points,
			};
		});

		const labels = series[0].points.map((point, index) => {
			const x =
				padding.left + (pointCount > 1 ? (index / (pointCount - 1)) * innerWidth : innerWidth / 2);
			return { x, label: point.label };
		});

		return { plottedSeries, yTicks, labels, innerHeight };
	});

	function shapePath(shape: TrendSeries['shape'], x: number, y: number, size = 4): string {
		switch (shape) {
			case 'square':
				return `M${x - size},${y - size} L${x + size},${y - size} L${x + size},${y + size} L${x - size},${y + size} Z`;
			case 'diamond':
				return `M${x},${y - size} L${x + size},${y} L${x},${y + size} L${x - size},${y} Z`;
			case 'triangle':
				return `M${x},${y - size} L${x + size},${y + size} L${x - size},${y + size} Z`;
			case 'cross':
				return `M${x - size},${y - size} L${x + size},${y + size} M${x + size},${y - size} L${x - size},${y + size}`;
			case 'plus':
				return `M${x},${y - size} L${x},${y + size} M${x - size},${y} L${x + size},${y}`;
			default:
				return '';
		}
	}

	function markerSize(shape: TrendSeries['shape'], baseSize: number): number {
		if (shape === 'diamond') return baseSize * 1.15;
		return baseSize;
	}
</script>

<div bind:this={containerEl} class="relative w-full">
	{#if computed}
		<div class="mb-4 flex flex-wrap gap-3">
			{#each computed.plottedSeries as item (item.label)}
				<div class="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
					<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
						{#if item.shape === 'circle'}
							<circle cx="6" cy="6" r="3.5" fill={item.color} />
						{:else if item.shape === 'ring'}
							<circle cx="6" cy="6" r="3.6" fill="none" stroke={item.color} stroke-width="1.9" />
						{:else if item.shape === 'cross' || item.shape === 'plus'}
							<path
								d={shapePath(item.shape, 6, 6, markerSize(item.shape, 3))}
								stroke={item.color}
								stroke-width="1.75"
								stroke-linecap="round"
							/>
						{:else}
							<path d={shapePath(item.shape, 6, 6, markerSize(item.shape, 3))} fill={item.color} />
						{/if}
					</svg>
					<span>{item.label}</span>
				</div>
			{/each}
		</div>

		<svg width={chartWidth} {height} class="overflow-visible">
			{#each computed.yTicks as tick}
				<line
					x1={padding.left}
					y1={tick.y}
					x2={chartWidth - padding.right}
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

			{#each computed.plottedSeries as item (item.label)}
				<path d={item.linePath} fill="none" stroke={item.color} stroke-width="2" />
				{#each item.points as point}
					{#if item.shape === 'circle'}
						<circle cx={point.x} cy={point.y} r="4" fill={item.color} />
					{:else if item.shape === 'ring'}
						<circle cx={point.x} cy={point.y} r="4.1" fill="none" stroke={item.color} stroke-width="2" />
					{:else if item.shape === 'cross' || item.shape === 'plus'}
						<path
							d={shapePath(item.shape, point.x, point.y, markerSize(item.shape, 4))}
							stroke={item.color}
							stroke-width="2"
							stroke-linecap="round"
						/>
					{:else}
						<path d={shapePath(item.shape, point.x, point.y, markerSize(item.shape, 4))} fill={item.color} />
					{/if}
				{/each}
			{/each}

			{#if hoveredIndex != null}
				{@const hoverPoint = computed.labels[hoveredIndex]}
				<line
					x1={hoverPoint.x}
					y1={padding.top}
					x2={hoverPoint.x}
					y2={padding.top + computed.innerHeight}
					class="stroke-gray-300 dark:stroke-gray-600"
					stroke-width="1"
					stroke-dasharray="4 2"
				/>
				{#each computed.plottedSeries as item (item.label)}
					{@const point = item.points[hoveredIndex]}
					{#if item.shape === 'circle'}
						<circle cx={point.x} cy={point.y} r="5" fill={item.color} opacity="0.9" />
					{:else if item.shape === 'ring'}
						<circle cx={point.x} cy={point.y} r="5.1" fill="none" stroke={item.color} stroke-width="2.5" opacity="0.95" />
					{:else if item.shape === 'cross' || item.shape === 'plus'}
						<path
							d={shapePath(item.shape, point.x, point.y, markerSize(item.shape, 5))}
							stroke={item.color}
							stroke-width="2.5"
							stroke-linecap="round"
						/>
					{:else}
						<path d={shapePath(item.shape, point.x, point.y, markerSize(item.shape, 5))} fill={item.color} />
					{/if}
				{/each}
			{/if}

			{#each computed.labels as point}
				<text
					x={point.x}
					y={padding.top + computed.innerHeight + 22}
					text-anchor="middle"
					class="fill-gray-400 text-xs dark:fill-gray-500"
				>
					{point.label}
				</text>
			{/each}

			{#each computed.labels as point, index}
				{@const hitWidth = Math.max(20, chartWidth / computed.labels.length)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<rect
					x={point.x - hitWidth / 2}
					y={padding.top}
					width={hitWidth}
					height={computed.innerHeight}
					fill="transparent"
					onpointerenter={() => (hoveredIndex = index)}
					onpointerleave={() => (hoveredIndex = null)}
				/>
			{/each}
		</svg>

		{#if hoveredIndex != null}
			{@const hoverPoint = computed.labels[hoveredIndex]}
			{@const tooltipOnRight = hoverPoint.x < chartWidth / 2}
			<div
				class="pointer-events-none absolute z-10 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md dark:border-gray-600 dark:bg-gray-800"
				style="top: {padding.top - 4}px; {tooltipOnRight
					? `left: ${hoverPoint.x + 12}px`
					: `right: ${chartWidth - hoverPoint.x + 12}px`};"
			>
				<div class="mb-1 font-medium text-gray-600 dark:text-gray-300">{hoverPoint.label}</div>
				{#each computed.plottedSeries as item (item.label)}
					{@const point = item.points[hoveredIndex]}
					<div class="flex items-center gap-1.5" style={`color: ${item.color};`}>
						<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
							{#if item.shape === 'circle'}
								<circle cx="6" cy="6" r="3.5" fill={item.color} />
							{:else if item.shape === 'cross'}
								<path d={shapePath(item.shape, 6, 6, 3)} stroke={item.color} stroke-width="1.75" stroke-linecap="round" />
							{:else}
								<path d={shapePath(item.shape, 6, 6, 3)} fill={item.color} />
							{/if}
						</svg>
						<span>{item.label}: {point.value}</span>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="flex items-center justify-center text-sm text-gray-400 dark:text-gray-500" style="height: {height}px">
			No data
		</div>
	{/if}
</div>
