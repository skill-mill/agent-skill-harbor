<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Folder from '@lucide/svelte/icons/folder';
	import File from '@lucide/svelte/icons/file';

	interface TreeNode {
		name: string;
		path: string;
		children: TreeNode[];
	}

	interface Props {
		files: string[];
		linkPrefix?: string;
	}

	let { files, linkPrefix = '' }: Props = $props();

	function buildTree(paths: string[]): TreeNode[] {
		const root: TreeNode[] = [];
		for (const path of paths) {
			const parts = path.split('/');
			let current = root;
			let accumulated = '';
			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				accumulated = accumulated ? `${accumulated}/${part}` : part;
				let existing = current.find((n) => n.name === part);
				if (!existing) {
					existing = { name: part, path: accumulated, children: [] };
					current.push(existing);
				}
				current = existing.children;
			}
		}
		return sortTree(root);
	}

	function sortTree(nodes: TreeNode[]): TreeNode[] {
		return nodes
			.map((n) => ({ ...n, children: sortTree(n.children) }))
			.sort((a, b) => {
				const aIsDir = a.children.length > 0 ? 0 : 1;
				const bIsDir = b.children.length > 0 ? 0 : 1;
				if (aIsDir !== bIsDir) return aIsDir - bIsDir;
				return a.name.localeCompare(b.name);
			});
	}

	let tree = $derived(buildTree(files));

	let openDirs = new SvelteSet<string>();

	function toggle(path: string) {
		if (openDirs.has(path)) {
			openDirs.delete(path);
		} else {
			openDirs.add(path);
		}
	}

	// Auto-expand all on mount
	$effect(() => {
		function collect(nodes: TreeNode[]) {
			for (const n of nodes) {
				if (n.children.length > 0) {
					openDirs.add(n.path);
					collect(n.children);
				}
			}
		}
		collect(tree);
	});
</script>

{#snippet renderNodes(nodes: TreeNode[], depth: number)}
	{#each nodes as node (node.path)}
		{#if node.children.length > 0}
			<!-- Directory -->
			<li>
				<button
					onclick={() => toggle(node.path)}
					class="group flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
					style="padding-left: {depth * 16 + 4}px"
				>
					<ChevronRight
						class="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform dark:text-gray-500 {openDirs.has(node.path)
							? 'rotate-90'
							: ''}"
					/>
					{#if openDirs.has(node.path)}
						<FolderOpen class="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
					{:else}
						<Folder class="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
					{/if}
					<span class="truncate">{node.name}</span>
				</button>
				{#if openDirs.has(node.path)}
					<ul>
						{@render renderNodes(node.children, depth + 1)}
					</ul>
				{/if}
			</li>
		{:else}
			<!-- File -->
			<li>
				<a
					href="{linkPrefix}{node.path}"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-1.5 rounded px-1 py-0.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400"
					style="padding-left: {depth * 16 + 4 + 18}px"
				>
					<File class="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
					<span class="truncate">{node.name}</span>
				</a>
			</li>
		{/if}
	{/each}
{/snippet}

<ul class="space-y-0.5">
	{@render renderNodes(tree, 0)}
</ul>
