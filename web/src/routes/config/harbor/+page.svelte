<script lang="ts">
	import { t } from '$lib/i18n';
	import * as Popover from '$lib/components/ui/popover';

	let { data } = $props();

	// Config labels/help are resolved mechanically from YAML keys:
	// settings.label.<yamlKey> and settings.help.<yamlKey>
	// so adding a new item usually only needs i18n entries.
	function getHelpKey(yamlKey: string): string {
		return `settings.help.${yamlKey}`;
	}

	function getHelpText(yamlKey: string, translate: (key: string) => string): string | null {
		const helpKey = getHelpKey(yamlKey);
		const text = translate(helpKey);
		return text === helpKey ? null : text;
	}

	function getLabelKey(yamlKey: string): string {
		return `settings.label.${yamlKey}`;
	}
</script>

{#snippet yamlKeyHint(key: string)}
	{@const helpText = getHelpText(key, $t)}
	<Popover.Root>
		<Popover.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					type="button"
					class="inline-flex items-center rounded p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
					aria-label={`Open YAML key ${key}`}
				>
					<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8.75-3a.75.75 0 011.5 0v.25a.75.75 0 01-1.5 0V7zm0 2.5a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V9.5z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-72">
			<div class="space-y-1">
				<div class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">YAML key</div>
				<code
					class="block break-all rounded bg-gray-100 px-1.5 py-1 text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100"
				>
					{key}
				</code>
				{#if helpText}
					<div class="pt-2 text-sm leading-6 text-gray-700 dark:text-gray-200">
						{helpText}
					</div>
				{/if}
			</div>
		</Popover.Content>
	</Popover.Root>
{/snippet}

<div class="space-y-8">
	<section>
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
			{$t('settings.collector.title')}
		</h2>
		<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
			<table class="w-full">
				<thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
					<tr>
						<th
							class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{$t('settings.columns.label')}
						</th>
						<th
							class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{$t('settings.columns.value')}
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('collector.exclude_forks'))}</span>
								{@render yamlKeyHint('collector.exclude_forks')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{#if data.settings.collector.exclude_forks}
								<span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
											clip-rule="evenodd"
										/>
									</svg>
									{$t('settings.enabled')}
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path
											d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
										/>
									</svg>
									{$t('settings.disabled')}
								</span>
							{/if}
						</td>
					</tr>
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('collector.include_origin_repos'))}</span>
								{@render yamlKeyHint('collector.include_origin_repos')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{#if data.settings.collector.include_origin_repos}
								<span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
											clip-rule="evenodd"
										/>
									</svg>
									{$t('settings.enabled')}
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path
											d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
										/>
									</svg>
									{$t('settings.disabled')}
								</span>
							{/if}
						</td>
					</tr>
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('collector.excluded_repos'))}</span>
								{@render yamlKeyHint('collector.excluded_repos')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{#if data.settings.collector.excluded_repos.length > 0}
								<ul class="list-inside list-disc space-y-0.5">
									{#each data.settings.collector.excluded_repos as repo}
										<li>
											{#if data.orgName}
												<a
													href="https://github.com/{data.orgName}/{repo}"
													target="_blank"
													rel="noopener noreferrer"
													class="text-blue-600 hover:underline dark:text-blue-400">{repo}</a
												>
											{:else}
												{repo}
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<span class="text-gray-400 dark:text-gray-500">{$t('settings.empty_list')}</span>
							{/if}
						</td>
					</tr>
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('collector.included_extra_repos'))}</span>
								{@render yamlKeyHint('collector.included_extra_repos')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{#if data.settings.collector.included_extra_repos.length > 0}
								<ul class="list-inside list-disc space-y-0.5">
									{#each data.settings.collector.included_extra_repos as url}
										<li>
											{#if url.startsWith('https://') || url.startsWith('http://')}
												<a
													href={url}
													target="_blank"
													rel="noopener noreferrer"
													class="text-blue-600 hover:underline dark:text-blue-400">{url}</a
												>
											{:else}
												{url}
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<span class="text-gray-400 dark:text-gray-500">{$t('settings.empty_list')}</span>
							{/if}
						</td>
					</tr>
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('collector.history_limit'))}</span>
								{@render yamlKeyHint('collector.history_limit')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{data.settings.collector.history_limit}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
			{$t('settings.audit.title')}
		</h2>
		<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
			<table class="w-full">
				<thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
					<tr>
						<th
							class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{$t('settings.columns.label')}
						</th>
						<th
							class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{$t('settings.columns.value')}
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('audit.exclude_community_repos'))}</span>
								{@render yamlKeyHint('audit.exclude_community_repos')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{#if data.settings.audit.exclude_community_repos}
								<span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
											clip-rule="evenodd"
										/>
									</svg>
									{$t('settings.enabled')}
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path
											d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
										/>
									</svg>
									{$t('settings.disabled')}
								</span>
							{/if}
						</td>
					</tr>
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('audit.engines'))}</span>
								{@render yamlKeyHint('audit.engines')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{#if data.settings.audit.engines.length > 0}
								<div class="space-y-3">
									{#each data.settings.audit.engines as engine}
										<div class="rounded-md border border-gray-200 p-3 dark:border-gray-700">
											<div class="flex flex-wrap items-center gap-2">
												<code class="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">{engine.id}</code>
												{#if engine.timeout_sec}
													<span class="text-xs text-gray-500 dark:text-gray-400">
														{$t('settings.audit.timeout_sec')}: {engine.timeout_sec}s
													</span>
												{/if}
											</div>
											{#if engine.command}
												<div class="mt-2">
													<div class="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
														{$t('settings.audit.command')}
													</div>
													<code class="block break-all rounded bg-gray-100 px-2 py-1.5 text-xs dark:bg-gray-800">
														{engine.command.join(' ')}
													</code>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<span class="text-gray-400 dark:text-gray-500">{$t('settings.empty_list')}</span>
							{/if}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
			{$t('settings.catalog.title')}
		</h2>
		<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
			<table class="w-full">
				<thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
					<tr>
						<th
							class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{$t('settings.columns.label')}
						</th>
						<th
							class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{$t('settings.columns.value')}
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('catalog.skill.fresh_period_days'))}</span>
								{@render yamlKeyHint('catalog.skill.fresh_period_days')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{data.settings.catalog.skill.fresh_period_days}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
			{$t('settings.ui.title')}
		</h2>
		<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
			<table class="w-full">
				<thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
					<tr>
						<th
							class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{$t('settings.columns.label')}
						</th>
						<th
							class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{$t('settings.columns.value')}
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
							<div class="flex items-center gap-1.5">
								<span>{$t(getLabelKey('ui.title'))}</span>
								{@render yamlKeyHint('ui.title')}
							</div>
						</td>
						<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
							{data.settings.ui.title}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
