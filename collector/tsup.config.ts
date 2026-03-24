import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		'bin/collector': 'bin/collector.ts',
		'src/cli/commands/collect': 'src/cli/commands/collect.ts',
		'src/cli/commands/detect-enabled-plugin-manifests': 'src/cli/commands/detect-enabled-plugin-manifests.ts',
		'src/cli/commands/post-collect': 'src/cli/commands/post-collect.ts',
		'src/runtime/collect-org-skills': 'src/runtime/collect-org-skills.ts',
		'src/runtime/collects': 'src/runtime/collects.ts',
		'src/runtime/post-collect/enabled-plugin-manifests': 'src/runtime/post-collect/enabled-plugin-manifests.ts',
		'src/runtime/post-collect': 'src/runtime/post-collect.ts',
	},
	format: 'esm',
	target: 'node24',
	outDir: 'dist',
	clean: true,
	splitting: false,
});
