<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		change?: number;
		sub?: string;
	}

	let { label, value, change, sub }: Props = $props();
</script>

<div
	class="rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
>
	<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
	<dd class="mt-1 flex items-baseline gap-2">
		{#if change != null && change !== 0}
			<span
				class="text-sm font-medium {change > 0
					? 'text-emerald-600 dark:text-emerald-400'
					: 'text-red-600 dark:text-red-400'}"
			>
				{change > 0 ? '+' : ''}{change}
			</span>
		{/if}
		<span class="text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value}</span>
	</dd>
	{#if sub}
		<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
	{/if}
</div>
