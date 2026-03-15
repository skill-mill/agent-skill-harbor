<script lang="ts">
	import { browser } from '$app/environment';
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import GovernanceBadge from '$lib/components/GovernanceBadge.svelte';
	import * as Select from '$lib/components/ui/select';
	import ViewTabs from '$lib/components/ViewTabs.svelte';
	import { t } from '$lib/i18n';
	import type { FlatSkillEntry, UsagePolicy } from '$lib/types';
	import type { GraphNodeAttrs, SkillNodeAttrs, RepoNodeAttrs } from '$lib/utils/graph';
	import { getResolvedFromRepoLabel } from '$lib/utils/resolved-from';

	interface Props {
		data: { skills: FlatSkillEntry[] };
	}

	let { data }: Props = $props();

	let searchQuery = $state('');
	let ownerFilterValue = $state('__all__');
	let graphRef:
		| { zoomIn: () => void; zoomOut: () => void; zoomReset: () => void; getCanvasDataURL: () => string | null }
		| undefined = $state();

	$effect(() => {
		if (!browser) return;
		const params = new URLSearchParams(window.location.search);
		searchQuery = params.get('q') ?? '';
		const owner = params.get('owner');
		if (owner === 'org') ownerFilterValue = 'org';
		else if (owner === 'community') ownerFilterValue = 'community';
		else ownerFilterValue = '__all__';
	});

	let ownerFilter = $derived(ownerFilterValue !== '__all__' ? ownerFilterValue : null);

	let filteredSkills = $derived.by(() => {
		if (!ownerFilter) return data.skills;
		return data.skills.filter((s) => (ownerFilter === 'org' ? s.isOrgOwned : !s.isOrgOwned));
	});

	function updateUrl(newQuery: string) {
		if (!browser) return;
		const params = new URLSearchParams();
		if (newQuery) params.set('q', newQuery);
		if (ownerFilterValue !== '__all__') params.set('owner', ownerFilterValue);
		const search = params.toString();
		goto(`${base}/graph/${search ? `?${search}` : ''}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function onOwnerFilterChange(value: string | undefined) {
		ownerFilterValue = value ?? '__all__';
		updateUrl(searchQuery);
	}

	function handlePrint() {
		const dataURL = graphRef?.getCanvasDataURL();
		if (!dataURL) return;
		const win = window.open('', '_blank');
		if (!win) return;
		win.document.write(
			`<!DOCTYPE html><html><head><title>Knowledge Graph</title><style>@media print{@page{margin:0.5cm}body{margin:0}}body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src="${dataURL}" onload="window.print();window.close()"></body></html>`,
		);
		win.document.close();
	}

	let selectedNodeId = $state<string | null>(null);
	let selectedAttrs = $state<GraphNodeAttrs | null>(null);
	let panelOpen = $derived(selectedNodeId !== null && selectedAttrs !== null);

	function handleNodeSelect(nodeId: string | null, attrs: GraphNodeAttrs | null) {
		selectedNodeId = nodeId;
		selectedAttrs = attrs;
	}

	function closePanel() {
		selectedNodeId = null;
		selectedAttrs = null;
	}

	$effect(() => {
		const selected = selectedAttrs;
		const skills = data.skills;
		if (!selected) return;

		if (selected.nodeType === 'skill' && !skills.some((skill) => `skill:${skill.key}` === selectedNodeId)) {
			closePanel();
			return;
		}

		if (
			selected.nodeType === 'repo' &&
			!skills.some((skill) => {
				const ownerRepo = `${skill.owner}/${skill.repo}`;
				const fromStr = getResolvedFromRepoLabel(skill);
				return ownerRepo === selected.label || fromStr === selected.label;
			})
		) {
			closePanel();
		}
	});

	let skillDetailPath = $derived.by(() => {
		if (!selectedAttrs || selectedAttrs.nodeType !== 'skill') return null;
		return `${base}/skills/${(selectedAttrs as SkillNodeAttrs).skillKey}`;
	});

	let repoUrl = $derived.by(() => {
		if (!selectedAttrs) return null;
		if (selectedAttrs.nodeType === 'repo') return (selectedAttrs as RepoNodeAttrs).url;
		return `https://github.com/${selectedAttrs.owner}/${selectedAttrs.repo}`;
	});

	let relatedSkills = $derived.by(() => {
		if (!selectedAttrs || selectedAttrs.nodeType !== 'repo') return [];
		const repoLabel = selectedAttrs.label;
		return data.skills.filter((s) => {
			const ownerRepo = `${s.owner}/${s.repo}`;
			const fromStr = getResolvedFromRepoLabel(s);
			return ownerRepo === repoLabel || fromStr === repoLabel;
		});
	});
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}Knowledge Graph - Agent Skill Harbor</title>
</svelte:head>

<div class="relative flex h-[calc(100vh-65px)]">
	<!-- Graph canvas -->
	<div class="relative min-h-0 flex-1 bg-gray-50 dark:bg-gray-950">
		{#if browser}
			{#await import('$lib/components/SkillGraph.svelte') then module}
				<module.default bind:this={graphRef} skills={filteredSkills} {searchQuery} onNodeSelect={handleNodeSelect} />
			{/await}
		{/if}

		<!-- Top bar overlay -->
		<div
			class="pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
		>
			<!-- Search + Filter (left) -->
			<div class="pointer-events-auto flex flex-wrap items-center gap-2">
				<div class="relative">
					<svg
						class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
							clip-rule="evenodd"
						/>
					</svg>
					<input
						type="text"
						bind:value={searchQuery}
						oninput={() => updateUrl(searchQuery)}
						placeholder="Search nodes..."
						class="w-[min(14rem,calc(100vw-7rem))] rounded-lg border border-gray-200 bg-white/80 py-1.5 pl-8 pr-8 text-sm text-gray-900 shadow-sm backdrop-blur-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 sm:w-56 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
					/>
					{#if searchQuery}
						<button
							onclick={() => {
								searchQuery = '';
								updateUrl('');
							}}
							class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
							aria-label="Clear search"
						>
							<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
								<path
									d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
								/>
							</svg>
						</button>
					{/if}
				</div>
				<Select.Root type="single" value={ownerFilterValue} onValueChange={onOwnerFilterChange}>
					<Select.Trigger
						size="sm"
						class="h-8 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm {ownerFilter
							? 'border-blue-300 bg-blue-100/90 text-blue-800 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
							: 'border-gray-200 bg-white/80 text-gray-600 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-400'}"
					>
						{ownerFilter ? $t(`common.orgOwnership.${ownerFilter}`) : $t('filter.allOwner')}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="__all__" label={$t('filter.all')} />
						<Select.Item value="org" label={$t('common.orgOwnership.org')} />
						<Select.Item value="community" label={$t('common.orgOwnership.community')} />
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Tabs (center) -->
			<div
				class="pointer-events-auto self-start rounded-lg border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm sm:self-auto dark:border-gray-700 dark:bg-gray-900/80"
			>
				<ViewTabs activeView="graph" />
			</div>

			<!-- Controls (right) -->
			<div class="pointer-events-auto flex items-start gap-2 self-end sm:self-auto">
				<button
					onclick={handlePrint}
					class="rounded-lg border border-gray-200 bg-white/80 px-2.5 py-2 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:bg-gray-800"
					aria-label="Print graph"
					title="Print"
				>
					<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
				<div
					class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80"
				>
					<button
						onclick={() => graphRef?.zoomIn()}
						class="px-2.5 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
						aria-label="Zoom in"
						title="Zoom in"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path
								d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
							/>
						</svg>
					</button>
					<div class="border-t border-gray-200 dark:border-gray-700"></div>
					<button
						onclick={() => graphRef?.zoomOut()}
						class="px-2.5 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
						aria-label="Zoom out"
						title="Zoom out"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
					<div class="border-t border-gray-200 dark:border-gray-700"></div>
					<button
						onclick={() => graphRef?.zoomReset()}
						class="px-2.5 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
						aria-label="Reset zoom"
						title="Reset"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.451a.75.75 0 000-1.5H4.5a.75.75 0 00-.75.75v3.75a.75.75 0 001.5 0v-2.033l.364.363a7 7 0 0011.712-3.138.75.75 0 00-1.449-.391zm-10.624-3.85a5.5 5.5 0 019.201-2.465l.312.31H11.75a.75.75 0 000 1.5h3.75a.75.75 0 00.75-.75V2.419a.75.75 0 00-1.5 0v2.034l-.364-.364A7 7 0 002.674 7.228a.75.75 0 001.449.391z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Mobile backdrop -->
	{#if panelOpen && selectedAttrs}
		<button
			type="button"
			class="absolute inset-0 z-20 bg-gray-950/35 md:hidden"
			aria-label="Close details panel"
			onclick={closePanel}
		></button>
	{/if}

	<!-- Side Panel -->
	{#if panelOpen && selectedAttrs}
		<div
			class="absolute inset-x-0 bottom-0 z-30 max-h-[72vh] overflow-y-auto rounded-t-2xl border border-gray-200 bg-white p-5 shadow-2xl md:relative md:inset-auto md:z-auto md:w-80 md:shrink-0 md:rounded-none md:border-y-0 md:border-r-0 md:border-l dark:border-gray-700 dark:bg-gray-900"
		>
			<div class="mb-4 flex items-start justify-between">
				<h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">
					{selectedAttrs.label}
				</h2>
				<button
					onclick={closePanel}
					class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
					aria-label="Close"
				>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path
							d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
						/>
					</svg>
				</button>
			</div>

			{#if selectedAttrs.nodeType === 'skill'}
				{@const attrs = selectedAttrs as SkillNodeAttrs}
				<div class="space-y-3 text-sm">
					<div>
						<span
							class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
							>Skill</span
						>
					</div>
					{#if attrs.description}
						<p class="text-gray-600 dark:text-gray-400">{attrs.description}</p>
					{/if}
					<dl class="space-y-1.5">
						<div class="flex gap-2">
							<dt class="text-gray-500 dark:text-gray-400">Repo:</dt>
							<dd class="font-medium text-gray-900 dark:text-gray-100">
								{attrs.owner}/{attrs.repo}
							</dd>
						</div>
						<div class="flex items-center gap-2">
							<dt class="text-gray-500 dark:text-gray-400">Status:</dt>
							<dd><GovernanceBadge status={attrs.usagePolicy as UsagePolicy} /></dd>
						</div>
					</dl>
					<div class="flex flex-col gap-2 pt-2">
						{#if skillDetailPath}
							<a
								href={skillDetailPath}
								class="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
							>
								View Detail
							</a>
						{/if}
						{#if repoUrl}
							<a
								href={repoUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
									<path
										d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
									/>
								</svg>
								GitHub
							</a>
						{/if}
					</div>
				</div>
			{:else if selectedAttrs.nodeType === 'repo'}
				{@const attrs = selectedAttrs as RepoNodeAttrs}
				<div class="space-y-3 text-sm">
					<div>
						<span
							class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
							>Repository</span
						>
					</div>
					<dl class="space-y-1.5">
						<div class="flex gap-2">
							<dt class="text-gray-500 dark:text-gray-400">Owner:</dt>
							<dd class="font-medium text-gray-900 dark:text-gray-100">{attrs.owner}</dd>
						</div>
						<div class="flex gap-2">
							<dt class="text-gray-500 dark:text-gray-400">Repo:</dt>
							<dd class="font-medium text-gray-900 dark:text-gray-100">{attrs.repo}</dd>
						</div>
					</dl>

					{#if relatedSkills.length > 0}
						<div class="pt-2">
							<h3 class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
								Related Skills
							</h3>
							<ul class="space-y-1">
								{#each relatedSkills as skill}
									<li>
										<a
											href="{base}/skills/{skill.key}"
											class="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
										>
											{skill.frontmatter.name ?? skill.repo}
										</a>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					<div class="pt-2">
						<a
							href={attrs.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
								<path
									d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
								/>
							</svg>
							GitHub
						</a>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="hidden w-80 shrink-0 items-center justify-center border-l border-gray-200 bg-white p-5 md:flex dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-sm text-gray-400 dark:text-gray-500">Click a node to see details</p>
		</div>
	{/if}
</div>
