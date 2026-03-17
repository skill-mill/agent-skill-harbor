<script lang="ts">
	import type { LabelIntent } from '$lib/types';

	interface Props {
		label: string;
		intent?: LabelIntent;
	}

	let { label, intent = 'neutral' }: Props = $props();

	function labelClasses(value: LabelIntent): string {
		switch (value) {
			case 'success':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
			case 'info':
				return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
			case 'warn':
				return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
			case 'danger':
				return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
		}
	}
</script>

<span class={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${labelClasses(intent)}`}>
	{label}
</span>
