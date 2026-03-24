import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		'bin/cli': 'bin/cli.ts',
		'src/cli/commands/build': 'src/cli/commands/build.ts',
		'src/cli/commands/deploy': 'src/cli/commands/deploy.ts',
		'src/cli/commands/dev': 'src/cli/commands/dev.ts',
		'src/cli/paths': 'src/cli/paths.ts',
		'src/cli/commands/init': 'src/cli/commands/init.ts',
		'src/cli/commands/preview': 'src/cli/commands/preview.ts',
		'src/cli/commands/setup': 'src/cli/commands/setup.ts',
		'src/cli/setup': 'src/cli/setup.ts',
	},
	format: 'esm',
	target: 'node24',
	outDir: 'dist',
	clean: true,
	splitting: false,
});
