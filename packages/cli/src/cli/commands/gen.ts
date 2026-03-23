import { packageRoot, userRoot } from '../paths.js';
import { getGenTemplate, listGenTemplateIds, scaffoldPlugin } from '../gen.js';

function printUsage(): void {
	console.error(`Usage: harbor gen <${listGenTemplateIds().join('|')}>`);
}

export async function runCommand(argv = process.argv.slice(3)): Promise<void> {
	const target = argv[0];

	const template = target ? getGenTemplate(target) : undefined;
	if (!template) {
		printUsage();
		process.exit(1);
	}

	try {
		const createdPath = scaffoldPlugin(packageRoot, userRoot, template.id);
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
