import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		'bin/cli': 'bin/cli.ts',
		'src/cli/paths': 'src/cli/paths.ts',
		'src/cli/commands/gen': 'src/cli/commands/gen.ts',
		'src/cli/commands/init': 'src/cli/commands/init.ts',
		'src/cli/gen': 'src/cli/gen.ts',
	},
	format: 'esm',
	target: 'node24',
	outDir: 'dist',
	clean: true,
	splitting: false,
});
