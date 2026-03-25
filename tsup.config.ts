import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		'bin/cli': 'bin/cli.ts',
		'src/cli/paths': 'src/cli/paths.ts',
		'src/cli/commands/init': 'src/cli/commands/init.ts',
		'src/cli/commands/setup': 'src/cli/commands/setup.ts',
		'src/cli/setup': 'src/cli/setup.ts',
		'src/runtime/build': 'src/runtime/build.ts',
		'src/runtime/dev': 'src/runtime/dev.ts',
		'src/runtime/preview': 'src/runtime/preview.ts',
	},
	format: 'esm',
	target: 'node24',
	outDir: 'dist',
	clean: true,
	splitting: false,
});
