import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		'bin/cli': 'bin/cli.ts',
		'src/cli/paths': 'src/cli/paths.ts',
		'src/cli/commands/build': 'src/cli/commands/build.ts',
		'src/cli/commands/dev': 'src/cli/commands/dev.ts',
		'src/cli/commands/preview': 'src/cli/commands/preview.ts',
		'src/cli/commands/collect': 'src/cli/commands/collect.ts',
		'src/cli/commands/init': 'src/cli/commands/init.ts',
		'src/runtime/collect-org-skills': 'src/runtime/collect-org-skills.ts',
	},
	format: 'esm',
	target: 'node24',
	outDir: 'dist',
	clean: true,
	splitting: false,
});
