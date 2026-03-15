<script lang="ts">
	import { t } from '$lib/i18n';

	type DriftStatus = 'drifted' | 'in_sync' | 'unknown';

	interface Props {
		status?: DriftStatus;
	}

	let { status }: Props = $props();

	const styles: Record<DriftStatus, string> = {
		drifted: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
		in_sync:
			'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
		unknown:
			'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
	};

	const labelKeys: Record<DriftStatus, string> = {
		drifted: 'driftStatus.drifted',
		in_sync: 'driftStatus.inSync',
		unknown: 'driftStatus.unknown',
	};
</script>

{#if status}
	<span
		class="inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium {styles[
			status
		]}"
	>
		{$t(labelKeys[status])}
	</span>
{/if}
