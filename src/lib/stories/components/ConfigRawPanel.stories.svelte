<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ConfigRawPanel from '../../components/ConfigRawPanel.svelte';

	const sampleYaml = `ui:
  title: Agent Skill Harbor
  subtitle: Skills for internal agents
history_limit: 50
post_collect:
  plugins:
    - id: builtin.detect-drift # enabled by default
    - id: builtin.notify-slack`;

	const { Story } = defineMeta({
		title: 'Components/Config/ConfigRawPanel',
		component: ConfigRawPanel,
		args: {
			path: 'config/harbor.yaml',
			content: sampleYaml,
		},
	});
</script>

<Story name="AllVariants">
	{#snippet template()}
		<div class="space-y-4">
			<ConfigRawPanel path="config/harbor.yaml" content={sampleYaml} />
			<ConfigRawPanel path="config/governance.yaml" content={null} />
		</div>
	{/snippet}
</Story>

<Story name="Playground" />
