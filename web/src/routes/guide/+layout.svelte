<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { t, locale } from '$lib/i18n';

	let { data, children } = $props();
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="lg:grid lg:grid-cols-4 lg:gap-8">
		<nav class="mb-6 lg:col-span-1 lg:mb-0 lg:sticky lg:top-24 lg:self-start">
			<h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Guide</h2>
			<ul class="space-y-1">
				{#each data.docs as item}
					{@const href = item.slug ? `${base}/guide/${item.slug}` : `${base}/guide`}
					{@const active = $page.url.pathname === href}
					<li>
						<a
							{href}
							class="block rounded-md px-3 py-2 text-sm transition-colors {active
								? 'bg-gray-200 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100'
								: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'}"
						>
							{item.title[$locale] ?? item.title.en}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
		<div class="lg:col-span-3">
			{@render children()}
		</div>
	</div>
</div>
