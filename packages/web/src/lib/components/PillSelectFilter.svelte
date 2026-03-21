<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { setupViewTransition } from 'sveltekit-view-transition';

	export interface PillSelectOption {
		value: string;
		label: string;
	}

	interface Props {
		value: string;
		options: PillSelectOption[];
		triggerLabel: string;
		triggerClass: string;
		onValueChange: (value: string | undefined) => void;
		transitionName?: string;
	}

	let { value, options, triggerLabel, triggerClass, onValueChange, transitionName }: Props = $props();
	const { transition: viewTransition } = setupViewTransition();
</script>

{#if transitionName}
	<div
		class="inline-block w-fit"
		use:viewTransition={{
			name: transitionName,
			applyImmediately: true,
		}}
	>
		<Select.Root type="single" {value} onValueChange={onValueChange}>
			<Select.Trigger size="sm" class={triggerClass}>
				{triggerLabel}
			</Select.Trigger>
			<Select.Content>
				{#each options as option (option.value)}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
{:else}
	<div class="inline-block w-fit">
		<Select.Root type="single" {value} onValueChange={onValueChange}>
			<Select.Trigger size="sm" class={triggerClass}>
				{triggerLabel}
			</Select.Trigger>
			<Select.Content>
				{#each options as option (option.value)}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
{/if}
