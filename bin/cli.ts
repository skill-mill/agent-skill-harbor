#!/usr/bin/env node

export {};

const USAGE = `agent-skill-harbor CLI

Usage: harbor <command> [options]

Commands:
  init      Scaffold a new project
  setup     Scaffold optional plugin templates

Options:
  --project-root <path>  Override the target Harbor project root
  --help    Show this help message`;

function extractProjectRoot(argv: string[]): { projectRoot: string | null; argv: string[] } {
	const nextArgv: string[] = [];
	let projectRoot: string | null = null;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--project-root') {
			projectRoot = argv[i + 1] ?? null;
			i++;
			continue;
		}
		if (arg.startsWith('--project-root=')) {
			projectRoot = arg.slice('--project-root='.length);
			continue;
		}
		nextArgv.push(arg);
	}

	return { projectRoot, argv: nextArgv };
}

async function importLocalCommand(moduleName: string, exportName = 'runCommand'): Promise<void> {
	const mod = await import(moduleName);
	const run = mod[exportName];
	if (typeof run !== 'function') {
		throw new Error(`Missing exported function: ${exportName} from ${moduleName}`);
	}
	await run(process.argv.slice(3));
}

const extracted = extractProjectRoot(process.argv.slice(2));
process.argv = [process.argv[0] ?? 'node', process.argv[1] ?? 'harbor', ...extracted.argv];
if (extracted.projectRoot) {
	process.env.SKILL_HARBOR_PROJECT_ROOT = extracted.projectRoot;
}

const command = process.argv[2];

switch (command) {
	case 'init':
		await importLocalCommand('../src/cli/commands/init.js');
		break;
	case 'setup':
		await importLocalCommand('../src/cli/commands/setup.js');
		break;
	default:
		console.log(USAGE);
		if (command && command !== '--help' && command !== '-h') {
			console.error(`\nUnknown command: ${command}`);
			process.exit(1);
		}
		break;
}
