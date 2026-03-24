<script lang="ts">
	import { locale, setLocale, type Locale } from '$lib/i18n';
	import ToggleGroup from '$lib/components/ToggleGroup.svelte';

	const locales: { value: Locale; label: string }[] = [
		{ value: 'ja', label: 'JA' },
		{ value: 'en', label: 'EN' },
	];
</script>

<ToggleGroup items={locales} selected={$locale} onSelect={setLocale} />
