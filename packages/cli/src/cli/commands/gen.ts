import { packageRoot, userRoot } from '../paths.js';
import { scaffoldExampleUserDefinedPlugin } from '../gen.js';

export async function runCommand(argv = process.argv.slice(3)): Promise<void> {
	const target = argv[0];

	if (target !== 'example-user-defined-plugin') {
		console.error('Usage: harbor gen example-user-defined-plugin');
		process.exit(1);
		return;
	}

	try {
		const createdPath = scaffoldExampleUserDefinedPlugin(packageRoot, userRoot);
		console.log('Generated example user-defined plugin.');
		console.log(`  Path: ${createdPath}`);
		console.log('  Next: uncomment `- id: example-user-defined-plugin` in config/harbor.yaml');
	} catch (error: unknown) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}
