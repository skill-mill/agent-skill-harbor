#!/usr/bin/env node

export {};

const USAGE = `agent-skill-harbor CLI

Usage: harbor <command> [options]

Commands:
  init      Scaffold a new project
  gen       Generate optional project templates
  collect   Collect skills from GitHub organization
  post-collect Run collect follow-up plugins
  build     Build the web catalog (static site)
  deploy    Deploy the built catalog
  dev       Start development server
  preview   Preview the built site

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

async function importCommand(
	moduleName: string,
	packageName: string,
	exportName = 'runCommand',
): Promise<void> {
	try {
		const mod = await import(moduleName);
		const run = mod[exportName];
		if (typeof run !== 'function') {
			throw new Error(`Missing exported function: ${exportName} from ${moduleName}`);
		}
		await run(process.argv.slice(3));
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND') {
			const message =
				error instanceof Error ? error.message : String(error);
			if (message.includes(packageName)) {
				console.error(`Error: ${packageName} is required for this command.`);
				console.error(`  Install it in this environment and try again.`);
				process.exit(1);
			}
		}
		throw error;
	}
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
	process.env.SKILL_HARBOR_USER_ROOT = extracted.projectRoot;
}

const command = process.argv[2];

switch (command) {
	case 'init':
		await importLocalCommand('../src/cli/commands/init.js');
		break;
	case 'gen':
		await importLocalCommand('../src/cli/commands/gen.js');
		break;
	case 'collect':
		await importCommand('agent-skill-harbor-collector/collect', 'agent-skill-harbor-collector');
		break;
	case 'post-collect':
		await importCommand('agent-skill-harbor-post-collect/post-collect', 'agent-skill-harbor-post-collect');
		break;
	case 'build':
		await importCommand('agent-skill-harbor-web/build', 'agent-skill-harbor-web', 'runBuildCommand');
		break;
	case 'deploy':
		await importCommand('agent-skill-harbor-web/deploy', 'agent-skill-harbor-web', 'runDeployCommand');
		break;
	case 'dev':
		await importCommand('agent-skill-harbor-web/dev', 'agent-skill-harbor-web', 'runDevCommand');
		break;
	case 'preview':
		await importCommand('agent-skill-harbor-web/preview', 'agent-skill-harbor-web', 'runPreviewCommand');
		break;
	default:
		console.log(USAGE);
		if (command && command !== '--help' && command !== '-h') {
			console.error(`\nUnknown command: ${command}`);
			process.exit(1);
		}
		break;
}
