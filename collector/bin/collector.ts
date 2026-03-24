#!/usr/bin/env node

export {};

const USAGE = `agent-skill-harbor-collector

Usage: harbor-collector <command> [options]

Commands:
  collect       Collect skills from GitHub organization
  detect-enabled-plugin-manifests
                Inspect enabled post-collect plugins and print manifest info
  post-collect  Run collect follow-up plugins

Options:
  --project-root <path>  Override the target Harbor project root
`;

// Keep this in sync with bin/cli.ts. The two binaries are intentionally separate.
async function importLocalCommand(moduleName: string, exportName = 'runCommand'): Promise<void> {
	const mod = await import(moduleName);
	const run = mod[exportName];
	if (typeof run !== 'function') {
		throw new Error(`Missing exported function: ${exportName} from ${moduleName}`);
	}
	await run(process.argv.slice(3));
}

// Keep this in sync with bin/cli.ts. The two binaries are intentionally separate.
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

const extracted = extractProjectRoot(process.argv.slice(2));
process.argv = [process.argv[0] ?? 'node', process.argv[1] ?? 'harbor-collector', ...extracted.argv];
if (extracted.projectRoot) {
	process.env.SKILL_HARBOR_PROJECT_ROOT = extracted.projectRoot;
}

const command = process.argv[2];

switch (command) {
	case 'collect':
		await importLocalCommand('../src/cli/commands/collect.js');
		break;
	case 'detect-enabled-plugin-manifests':
		await importLocalCommand('../src/cli/commands/detect-enabled-plugin-manifests.js');
		break;
	case 'post-collect':
		await importLocalCommand('../src/cli/commands/post-collect.js');
		break;
	default:
		console.log(USAGE);
		if (command && command !== '--help' && command !== '-h') {
			console.error(`\nUnknown command: ${command}`);
			process.exit(1);
		}
		break;
}
