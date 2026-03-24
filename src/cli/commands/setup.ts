import { packageRoot, userRoot } from '../paths.js';
import { getSetupTemplate, listSetupTemplateIds, scaffoldPluginSurface } from '../setup.js';

function printUsage(): void {
	console.error(`Usage: harbor setup <${listSetupTemplateIds().join('|')}>`);
}

export async function runCommand(argv = process.argv.slice(3)): Promise<void> {
	const target = argv[0];
	const template = target ? getSetupTemplate(target) : undefined;
	if (template === undefined) {
		printUsage();
		process.exit(1);
	}

	try {
		const createdPath = scaffoldPluginSurface(packageRoot, userRoot, template.id);
		console.log(`Generated ${template.generatedLabel}.`);
		console.log(`  Path: ${createdPath}`);
		for (const nextStep of template.nextSteps) {
			console.log(`  Next: ${nextStep}`);
		}
	} catch (error: unknown) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}
