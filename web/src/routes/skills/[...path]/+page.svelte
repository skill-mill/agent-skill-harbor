<script lang="ts">
	import GovernanceBadge from '$lib/components/GovernanceBadge.svelte';
	import PluginLabelBadge from '$lib/components/PluginLabelBadge.svelte';
	import FileTree from '$lib/components/FileTree.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { FlatSkillEntry, LabelIntent, UsagePolicy } from '$lib/types';
	import { t, locale } from '$lib/i18n';
	import { dev } from '$app/environment';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import GithubSlugger from 'github-slugger';
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';
	import { dump as yamlDump } from 'js-yaml';
	import { getResolvedFrom, getResolvedFromUrl } from '$lib/utils/resolved-from';
	import FileText from '@lucide/svelte/icons/file-text';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Globe from '@lucide/svelte/icons/globe';
	import GitFork from '@lucide/svelte/icons/git-fork';
	import GitHubLogo from '$lib/components/icons/GitHubLogo.svelte';
	import SkillsmpLogo from '$lib/components/icons/SkillsmpLogo.svelte';

	interface Props {
		data: {
			skill: FlatSkillEntry;
			allSkills: FlatSkillEntry[];
			body: string;
			freshPeriodDays: number;
			pluginOutputs: {
				id: string;
				labelIntents: Record<string, LabelIntent>;
				result: Record<string, unknown> & { label?: string; raw?: string };
			}[];
		};
	}

	let { data }: Props = $props();
	let skill = $derived(data.skill);
	let body = $derived(data.body);
	let freshPeriodDays = $derived(data.freshPeriodDays);
	let pluginOutputs = $derived(data.pluginOutputs);
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

	function extractPlainText(tokens: import('marked').Tokens.Generic[] | undefined): string {
		if (!tokens) return '';
		let result = '';
		for (const token of tokens) {
			if ('text' in token && typeof token.text === 'string') {
				result += token.text;
			}
			if ('tokens' in token && Array.isArray(token.tokens)) {
				result += extractPlainText(token.tokens);
			}
			if ('items' in token && Array.isArray(token.items)) {
				for (const item of token.items) {
					if (item && typeof item === 'object' && 'tokens' in item && Array.isArray(item.tokens)) {
						result += extractPlainText(item.tokens);
					}
				}
			}
		}
		return result;
	}

	function resolveRepoPath(baseSkillPath: string, href: string): string {
		const [pathPart, hash = ''] = href.split('#');
		const segments = baseSkillPath
			.replace(/\/SKILL\.md$/, '')
			.split('/')
			.filter(Boolean);

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

	function getPluginExtraYaml(result: Record<string, unknown> & { label?: string; raw?: string }): string | null {
		const extraEntries = Object.entries(result).filter(([key, value]) => {
			if (key === 'label' || key === 'raw') return false;
			return value !== undefined;
		});
		if (extraEntries.length === 0) return null;
		return yamlDump(Object.fromEntries(extraEntries), {
			noRefs: true,
			lineWidth: 0
		}).trim();
	}

	const ACTIONABLE_INTENTS: Set<string> = new Set(['warn', 'danger', 'info']);

	function buildIssueUrl(
		plugin: { id: string; labelIntents: Record<string, LabelIntent>; result: Record<string, unknown> & { label?: string; raw?: string } },
	): string | null {
		if (!skill.repoKey.startsWith('github.com/')) return null;
		const intent = plugin.labelIntents[plugin.result.label ?? ''];
		if (!intent || !ACTIONABLE_INTENTS.has(intent)) return null;

		const repoUrl = `https://${skill.repoKey}`;
		const title = (plugin.result.raw ?? plugin.result.label ?? '').slice(0, 256);

		const bodyParts: string[] = [];
		bodyParts.push(`Harbor: ${$page.url.href}`);
		const extraYaml = getPluginExtraYaml(plugin.result);
		if (extraYaml) {
			bodyParts.push('```yaml\n' + extraYaml + '\n```');
		}
		const body = bodyParts.join('\n\n').slice(0, 8000);

		return `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
	}

	function renderSkillMarkdown(markdown: string, skill: FlatSkillEntry): string {
		const renderer = new marked.Renderer();
		const slugger = new GithubSlugger();

		renderer.html = ({ text }) => escapeHtml(text);
		renderer.heading = ({ tokens, depth }) => {
			const text = renderer.parser.parseInline(tokens);
			const id = slugger.slug(extractPlainText(tokens));
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
	let fromRef = $derived.by(() => getResolvedFrom(skill));
	let fromUrl = $derived.by(() => getResolvedFromUrl(skill));

	let isPublic = $derived(skill.visibility === 'public');

	let skillsmpUrl = $derived.by(() => {
		const dir = skill.skillPath.replace(/\/SKILL\.md$/, '').replace(/^SKILL\.md$/, '');
		const parts = [skill.owner, skill.repo];
		if (dir) parts.push(dir.replace(/^\./, '').replace(/[/_.]/g, '-'));
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
		<a href="{base}/skills" class="hover:text-gray-700 dark:hover:text-gray-200">{$t('header.catalog')}</a>
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
				<GitHubLogo />
				{$t('detail.viewRepository')}
			</a>
			<a
				href={skillFileUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				<FileText class="h-3.5 w-3.5" />
				{$t('detail.viewSkillMd')}
			</a>
			{#if isPublic}
				<a
					href={skillsmpUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<SkillsmpLogo />
					skillsmp.com
				</a>
				<a
					href={skillsShUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<SkillsmpLogo />
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
					<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.owner')}</dt>
					<dd>
						{#if skill.isOrgOwned}
							<span
								class="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
							>
								<Building2 class="h-3.5 w-3.5" />
								{skill.owner}
							</span>
						{:else}
							<span
								class="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
							>
								<Globe class="h-3.5 w-3.5" />
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
								<GitFork class="h-3.5 w-3.5" />
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
				{#if fromRef}
					<div class="flex gap-2">
						<dt class="text-gray-500 dark:text-gray-400">{$t('detail.field.origin')}</dt>
						<dd>
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
								<span class="text-sm font-medium text-gray-900 dark:text-gray-100">{fromRef}</span>
							{/if}
						</dd>
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

	{#if pluginOutputs.length > 0}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
			<h2 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Plugin Outputs</h2>
			<div class="space-y-4">
				{#each pluginOutputs as plugin}
					{@const extraYaml = getPluginExtraYaml(plugin.result)}
					{@const issueUrl = buildIssueUrl(plugin)}
					<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
						<div class="flex items-center gap-3">
							<code
								class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-100"
							>
								{plugin.id}
							</code>
							{#if plugin.result.label}
								<PluginLabelBadge
									label={plugin.result.label}
									intent={plugin.labelIntents[plugin.result.label] ?? 'neutral'}
								/>
							{/if}
							{#if issueUrl}
								<a
									href={issueUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
								>
									<GitHubLogo class="h-3.5 w-3.5" />
									Create Issue
								</a>
							{/if}
						</div>
						{#if plugin.result.raw}
							<div
								class="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm whitespace-pre-wrap text-gray-700 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-300"
							>
								{plugin.result.raw}
							</div>
						{/if}
						{#if extraYaml}
							<pre
								class="mt-3 overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs leading-6 text-gray-700 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-300"
							><code>{extraYaml}</code></pre>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Files -->
	{#if skill.files && skill.files.length > 0}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
			<h2 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
				{$t('detail.section.files')} ({skill.files.length})
			</h2>
			<FileTree files={skill.files} linkPrefix="https://{skill.repoKey}/blob/HEAD/" />
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
				<div class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
					{@html renderedBody}
				</div>
			{/if}
		</div>
	{/if}
</div>
