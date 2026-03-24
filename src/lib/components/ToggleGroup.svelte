<script lang="ts" generics="T extends string">
	import type { Component } from 'svelte';

	type ToggleItem<TValue extends string> = {
		value: TValue;
		label: string;
		icon?: Component<Record<string, unknown>>;
		animateIcon?: boolean;
		iconSize?: number;
	};

	let {
		items,
		selected,
		onSelect,
	}: {
		items: ToggleItem<T>[];
		selected: T;
		onSelect: (value: T) => void;
	} = $props();

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

	function getButtonState(itemValue: T): 'active' | 'idle' | 'hidden' {
		if (selected === itemValue) return 'active';
		if (expanded) return 'idle';
		return 'hidden';
	}

	function buttonClass(state: 'active' | 'idle' | 'hidden'): string {
		const base =
			'inline-flex items-center justify-center rounded-md py-0.5 transition-[max-width,opacity,padding] duration-200';

		if (state === 'active') {
			return `${base} min-h-6 min-w-8 bg-white px-1.5 text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100`;
		}

		if (state === 'idle') {
			return `${base} min-h-6 min-w-8 px-1.5 text-gray-500 opacity-100 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`;
		}

		return `${base} max-w-0 overflow-hidden px-0 opacity-0`;
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
	{#each items as item (item.value)}
		<button
			onclick={() => onSelect(item.value)}
			class={buttonClass(getButtonState(item.value))}
			title={item.label}
			aria-label={item.label}
		>
			{#if item.icon}
				<span class="inline-flex items-center justify-center leading-none">
					<item.icon class="h-4 w-4" size={item.iconSize} animate={item.animateIcon ? expanded : undefined} />
				</span>
			{:else}
				<span class="inline-flex h-4 items-center text-xs font-medium leading-none">{item.label}</span>
			{/if}
		</button>
	{/each}
</div>
