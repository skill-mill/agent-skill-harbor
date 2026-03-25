import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		'src/runtime/collect-command': 'src/runtime/collect-command.ts',
		'src/runtime/collect-org-skills': 'src/runtime/collect-org-skills.ts',
		'src/runtime/collects': 'src/runtime/collects.ts',
		'src/runtime/detect-enabled-plugin-manifests-command': 'src/runtime/detect-enabled-plugin-manifests-command.ts',
		'src/runtime/post-collect-command': 'src/runtime/post-collect-command.ts',
		'src/runtime/post-collect/enabled-plugin-manifests': 'src/runtime/post-collect/enabled-plugin-manifests.ts',
		'src/runtime/post-collect': 'src/runtime/post-collect.ts',
	},
	format: 'esm',
	target: 'node24',
	outDir: 'dist',
	clean: true,
	splitting: false,
});
