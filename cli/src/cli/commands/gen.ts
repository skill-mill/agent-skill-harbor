import { packageRoot, userRoot } from '../paths.js';
import { scaffoldSamplePlugin } from '../gen.js';

export async function runCommand(argv = process.argv.slice(3)): Promise<void> {
	const target = argv[0];

	if (target !== 'sample-plugin') {
		console.error('Usage: harbor gen sample-plugin');
		process.exit(1);
		return;
	}

	try {
		const createdPath = scaffoldSamplePlugin(packageRoot, userRoot);
		console.log('Generated example user-defined plugin.');
		console.log(`  Path: ${createdPath}`);
		console.log('  Next: uncomment `- id: example_user_defined_plugin` in config/harbor.yaml');
	} catch (error: unknown) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}
