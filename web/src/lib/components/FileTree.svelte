<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';

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
					<svg
						class="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform dark:text-gray-500 {openDirs.has(node.path) ? 'rotate-90' : ''}"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
							clip-rule="evenodd"
						/>
					</svg>
					<svg class="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
						{#if openDirs.has(node.path)}
							<path
								d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75z"
							/>
							<path
								d="M3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z"
							/>
						{:else}
							<path
								d="M3.75 3A1.75 1.75 0 002 4.75v10.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-8.5A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75z"
							/>
						{/if}
					</svg>
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
					<svg class="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="truncate">{node.name}</span>
				</a>
			</li>
		{/if}
	{/each}
{/snippet}

<ul class="space-y-0.5">
	{@render renderNodes(tree, 0)}
</ul>
