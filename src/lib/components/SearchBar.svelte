<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		value: string;
		onchange: (value: string) => void;
	}

	let { value, onchange }: Props = $props();

	let timeout: ReturnType<typeof setTimeout> | undefined;

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			onchange(target.value);
		}, 200);
	}
</script>

<div class="relative">
	<input
		type="text"
		placeholder={$t('search.placeholder')}
		{value}
		oninput={handleInput}
		class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
	/>
	<svg
		class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
		/>
	</svg>
</div>
