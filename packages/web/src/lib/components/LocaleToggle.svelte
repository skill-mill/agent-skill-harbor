<script lang="ts">
	import { locale, setLocale, type Locale } from '$lib/i18n';

	const locales: { value: Locale; label: string }[] = [
		{ value: 'en', label: 'EN' },
		{ value: 'ja', label: 'JA' },
	];

	let expanded = $state(false);
	let hideTimeout: ReturnType<typeof setTimeout>;

	function show() {
		clearTimeout(hideTimeout);
		expanded = true;
	}

	function hide() {
		hideTimeout = setTimeout(() => {
			expanded = false;
		}, 0);
	}
</script>

<div
	role="group"
	onmouseenter={show}
	onmouseleave={hide}
	onfocusin={show}
	onfocusout={hide}
	class="flex items-center rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800"
>
	{#each locales as { value, label }}
		<button
			onclick={() => setLocale(value)}
			class="rounded-md py-1 text-xs font-medium transition-all duration-200 {$locale === value
				? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100 px-2'
				: expanded
					? 'px-2 text-gray-500 opacity-100 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
					: 'max-w-0 overflow-hidden px-0 opacity-0'}"
			title={label}
			aria-label={label}
		>
			{label}
		</button>
	{/each}
</div>
