<script lang="ts">
	import GovernanceBadge from '$lib/components/GovernanceBadge.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { FlatSkillEntry, UsagePolicy } from '$lib/types';
	import { t, locale } from '$lib/i18n';
	import { dev } from '$app/environment';
	import { base } from '$app/paths';
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';

	interface Props {
		data: { skill: FlatSkillEntry; allSkills: FlatSkillEntry[]; body: string; freshPeriodDays: number };
	}

	let { data }: Props = $props();
	let skill = $derived(data.skill);
	let body = $derived(data.body);
	let freshPeriodDays = $derived(data.freshPeriodDays);
	let isNew = $derived(
		freshPeriodDays > 0 &&
			!!skill.registered_at &&
			Date.now() - new Date(skill.registered_at).getTime() < freshPeriodDays * 86_400_000,
	);

	function escapeHtml(text: string): string {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function isRelativeLink(href: string): boolean {
		return !/^(?:[a-z]+:)?\/\//i.test(href) && !href.startsWith('#') && !href.startsWith('mailto:');
	}

	function slugifyHeading(text: string): string {
		return text
			.toLowerCase()
			.trim()
			.replace(/<[^>]+>/g, '')
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');
	}

	function resolveRepoPath(baseSkillPath: string, href: string): string {
		const [pathPart, hash = ''] = href.split('#');
		const segments = baseSkillPath.replace(/\/SKILL\.md$/, '').split('/').filter(Boolean);

		for (const part of pathPart.split('/').filter(Boolean)) {
			if (part === '.') continue;
			if (part === '..') {
				segments.pop();
				continue;
			}
			segments.push(part);
		}

		const resolvedPath = segments.join('/');
		return hash ? `${resolvedPath}#${hash}` : resolvedPath;
	}

	function renderSkillMarkdown(markdown: string, skill: FlatSkillEntry): string {
		const renderer = new marked.Renderer();

		renderer.html = ({ text }) => escapeHtml(text);
		renderer.heading = ({ tokens, depth }) => {
			const text = renderer.parser.parseInline(tokens);
			const id = slugifyHeading(text);
			return `<h${depth} id="${escapeHtml(id)}">${text}</h${depth}>`;
		};
		renderer.link = function ({ href, title, tokens }) {
			const rawHref = href ?? '';
			const text = this.parser.parseInline(tokens);
			const safeTitle = title ? ` title="${escapeHtml(title)}"` : '';

			if (!rawHref) {
				return text;
			}

			const finalHref = isRelativeLink(rawHref)
				? `https://${skill.repoKey}/blob/HEAD/${resolveRepoPath(skill.skillPath, rawHref)}`
				: rawHref;

			return `<a href="${escapeHtml(finalHref)}"${safeTitle}>${text}</a>`;
		};

		return marked(markdown, { renderer }) as string;
	}

	let viewMode = $state<'rendered' | 'raw'>('rendered');
	// Layer 2: DOMPurify as final safety net
	let renderedBody = $derived(body ? DOMPurify.sanitize(renderSkillMarkdown(body, skill)) : '');

	let skillName = $derived(String(skill.frontmatter.name ?? skill.repo));
	let skillDescription = $derived(String(skill.frontmatter.description ?? ''));
	let repoUrl = $derived(`https://${skill.repoKey}`);
	let skillFileUrl = $derived(
		skill.skillPath === 'SKILL.md'
			? `https://${skill.repoKey}/blob/HEAD/SKILL.md`
			: `https://${skill.repoKey}/tree/HEAD/${skill.skillPath.replace(/\/SKILL\.md$/, '')}`,
	);
	let metadata = $derived((skill.frontmatter.metadata ?? {}) as Record<string, unknown>);
	let formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString($locale, { year: 'numeric', month: 'short', day: 'numeric' });
	let fromRef = $derived(typeof skill.frontmatter._from === 'string' ? skill.frontmatter._from : null);
	let fromUrl = $derived.by(() => {
		if (!fromRef) return null;
		const match = fromRef.match(/^([^@]+)@(.+)$/);
		if (!match) return null;
		return `https://github.com/${match[1]}/tree/${match[2]}`;
	});

	let isPublic = $derived(skill.visibility === 'public');

	let skillsmpUrl = $derived.by(() => {
		const dir = skill.skillPath.replace(/\/SKILL\.md$/, '').replace(/^SKILL\.md$/, '');
		const parts = [skill.owner, skill.repo];
		if (dir) parts.push(dir.replace(/[/_.]/g, '-'));
		parts.push('skill-md');
		return `https://skillsmp.com/skills/${parts.join('-').toLowerCase()}`;
	});

	let skillsShUrl = $derived.by(() => {
		const dir = skill.skillPath.replace(/\/SKILL\.md$/, '').replace(/^SKILL\.md$/, '');
		const skillName = dir ? dir.split('/').pop() : '';
		return `https://skills.sh/${skill.owner}/${skill.repo}${skillName ? '/' + skillName : ''}`;
	});
</script>

<svelte:head>
	<title>{dev ? '(Dev) ' : ''}{skillName} - Agent Skill Harbor</title>
	<meta name="description" content={skillDescription} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Breadcrumb -->
	<nav class="mb-6 text-sm text-gray-500 dark:text-gray-400">
		<a href="{base}/" class="hover:text-gray-700 dark:hover:text-gray-200">{$t('header.catalog')}</a>
		<span class="mx-2">/</span>
		<span class="text-gray-900 dark:text-gray-100">{skillName}</span>
	</nav>

	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-start justify-between gap-4">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">{skillName}</h1>
			<div class="flex shrink-0 items-center gap-2">
				{#if isNew}
					<span
						class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
					>
						{$t('skillCard.new')}
					</span>
				{/if}
				<GovernanceBadge status={skill.usage_policy as UsagePolicy} />
			</div>
		</div>
		<p class="mt-3 text-lg text-gray-600 dark:text-gray-400">{skillDescription}</p>
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<a
				href={repoUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
			>
				<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
					<path
						d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
					/>
				</svg>
				{$t('detail.viewRepository')}
			</a>
			<a
				href={skillFileUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
					<path
						d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
					/>
				</svg>
				{$t('detail.viewSkillMd')}
			</a>
			{#if isPublic}
				<a
					href={skillsmpUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z"
						/>
						<path
							fill-rule="evenodd"
							d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z"
							clip-rule="evenodd"
						/>
					</svg>
					skillsmp.com
				</a>
				<a
					href={skillsShUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z"
						/>
						<path
							fill-rule="evenodd"
							d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z"
							clip-rule="evenodd"
						/>
					</svg>
					skills.sh
				</a>
			{/if}
		</div>
	</div>

	<!-- Info Grid -->
	<div class="mb-8 grid gap-6 sm:grid-cols-2">
		<!-- Metadata -->
		<div class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
			<h2 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{$t('detail.section.details')}</h2>
			<dl class="space-y-1.5 text-sm">
				<div class="flex gap-2">
					<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.origin')}</dt>
					<dd>
						{#if skill.isOrgOwned}
							<span
								class="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
							>
								<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 3.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zm3.5-3.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 3.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{skill.owner}
							</span>
						{:else}
							<span
								class="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
							>
								<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
									<path
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
									/>
								</svg>
								{$t('detail.community')}
							</span>
						{/if}
					</dd>
				</div>
				<div class="flex gap-2">
					<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.repository')}</dt>
					<dd class="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
						{skill.owner}/{skill.repo}
						{#if skill.repo_sha}
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<span
											{...props}
											class="inline-flex cursor-default rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
											>{skill.repo_sha!.slice(0, 7)}</span
										>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p class="font-mono text-xs">{skill.repo_sha}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						{/if}
						{#if skill.is_fork}
							<span
								class="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
							>
								<svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
									<path
										d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"
									></path>
								</svg>
								Fork
							</span>
						{/if}
					</dd>
				</div>
				<div class="flex gap-2">
					<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.skillPath')}</dt>
					<dd class="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
						{skill.skillPath}
						{#if skill.tree_sha}
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<span
											{...props}
											class="inline-flex cursor-default rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
											>{skill.tree_sha!.slice(0, 7)}</span
										>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p class="font-mono text-xs">{skill.tree_sha}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						{/if}
					</dd>
				</div>
				<div class="flex gap-2">
					<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.platform')}</dt>
					<dd class="font-medium text-gray-900 dark:text-gray-100">{skill.platform}</dd>
				</div>
				<div class="flex gap-2">
					<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.visibility')}</dt>
					<dd class="font-medium text-gray-900 dark:text-gray-100">{skill.visibility}</dd>
				</div>
				{#if metadata.author}
					<div class="flex gap-2">
						<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.author')}</dt>
						<dd class="font-medium text-gray-900 dark:text-gray-100">{metadata.author}</dd>
					</div>
				{/if}
				{#if metadata.version}
					<div class="flex gap-2">
						<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.version')}</dt>
						<dd class="font-medium text-gray-900 dark:text-gray-100">{metadata.version}</dd>
					</div>
				{/if}
				{#if skill.registered_at}
					<div class="flex gap-2">
						<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.registeredAt')}</dt>
						<dd class="font-medium text-gray-900 dark:text-gray-100">{formatDate(skill.registered_at)}</dd>
					</div>
				{/if}
				{#if skill.updated_at}
					<div class="flex gap-2">
						<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.updatedAt')}</dt>
						<dd class="font-medium text-gray-900 dark:text-gray-100">{formatDate(skill.updated_at)}</dd>
					</div>
				{/if}
			</dl>
		</div>

		<!-- Governance -->
		<div class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
			<h2 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{$t('detail.section.governance')}</h2>
			<div class="flex items-center gap-3">
				<GovernanceBadge status={skill.usage_policy as UsagePolicy} />
			</div>
			{#if skill.note}
				<p class="mt-3 text-sm text-gray-700 dark:text-gray-300">{skill.note}</p>
			{/if}
		</div>
	</div>

	<!-- Files -->
	{#if skill.files && skill.files.length > 0}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
			<h2 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
				{$t('detail.section.files')} ({skill.files.length})
			</h2>
			<ul class="space-y-1">
				{#each skill.files as file}
					<li>
						<a
							href="https://{skill.repoKey}/blob/HEAD/{file}"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
						>
							<svg
								class="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
									clip-rule="evenodd"
								/>
							</svg>
							{file}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Source History -->
	{#if fromRef}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
			<h2 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{$t('detail.section.sourceHistory')}</h2>
			{#if fromUrl}
				<a
					href={fromUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
				>
					{fromRef}
				</a>
			{:else}
				<span class="text-sm text-gray-700 dark:text-gray-300">{fromRef}</span>
			{/if}
		</div>
	{/if}

	<!-- Skill Instructions -->
	{#if body}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">{$t('detail.section.instructions')}</h2>
				<div class="flex rounded-md border border-gray-200 dark:border-gray-700">
					<button
						onclick={() => (viewMode = 'rendered')}
						class="rounded-l-md px-3 py-1 text-xs font-medium transition-colors {viewMode === 'rendered'
							? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
							: 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						{$t('detail.viewMode.rendered')}
					</button>
					<button
						onclick={() => (viewMode = 'raw')}
						class="rounded-r-md border-l border-gray-200 px-3 py-1 text-xs font-medium transition-colors dark:border-gray-700 {viewMode ===
						'raw'
							? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
							: 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						{$t('detail.viewMode.raw')}
					</button>
				</div>
			</div>
			{#if viewMode === 'raw'}
				<pre class="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-300">{body}</pre>
			{:else}
				<div class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
					{@html renderedBody}
				</div>
			{/if}
		</div>
	{/if}
</div>
