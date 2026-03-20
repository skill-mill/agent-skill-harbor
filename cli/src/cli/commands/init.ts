import { basename, join, resolve } from 'node:path';
import {
	cpSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { packageRoot } from '../paths.js';

const INIT_USAGE = `Usage: harbor init [directory] [--workflows] [--config]

Modes:
  harbor init <directory>        Scaffold a new project into an empty directory
  harbor init . --workflows      Replace scaffolded workflow files
  harbor init . --config         Replace scaffolded config files
  harbor init . --workflows --config
                                 Replace both workflows and config files`;

const templatesDir = resolve(packageRoot, 'templates/init');
const cliPackageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf-8')) as {
	version: string;
	peerDependencies?: Record<string, string>;
};
const packageRange = `>=${cliPackageJson.version} <1`;

function getPeerDependencyRange(packageName: string): string {
	const range = cliPackageJson.peerDependencies?.[packageName];
	if (!range) {
		throw new Error(`Missing peer dependency version for ${packageName} in cli/package.json`);
	}
	return range;
}

const collectorRange = getPeerDependencyRange('agent-skill-harbor-collector');
const postCollectRange = getPeerDependencyRange('agent-skill-harbor-post-collect');
const webRange = getPeerDependencyRange('agent-skill-harbor-web');

interface InitOptions {
	targetDir: string;
	workflows: boolean;
	config: boolean;
}

function parseArgs(argv: string[]): InitOptions {
	const flags = new Set<string>();
	let targetArg: string | undefined;

	for (const arg of argv) {
		if (arg === '--workflows' || arg === '--config') {
			flags.add(arg);
			continue;
		}
		if (arg.startsWith('-')) {
			throw new Error(`Unknown option: ${arg}`);
		}
		if (targetArg) {
			throw new Error('Too many positional arguments.');
		}
		targetArg = arg;
	}

	return {
		targetDir: targetArg ? resolve(process.cwd(), targetArg) : process.cwd(),
		workflows: flags.has('--workflows'),
		config: flags.has('--config'),
	};
}

function renderTemplate(content: string, projectName: string): string {
	return content
		.replace('{{PROJECT_NAME}}', projectName)
		.replaceAll('{{PACKAGE_RANGE}}', packageRange)
		.replaceAll('{{COLLECTOR_RANGE}}', collectorRange)
		.replaceAll('{{POST_COLLECT_RANGE}}', postCollectRange)
		.replaceAll('{{WEB_RANGE}}', webRange);
}

function copyTemplateFile(source: string, destination: string, projectName: string): void {
	const content = renderTemplate(readFileSync(source, 'utf-8'), projectName);
	mkdirSync(resolve(destination, '..'), { recursive: true });
	writeFileSync(destination, content);
}

function hasCategoryMode(options: InitOptions): boolean {
	return options.workflows || options.config;
}

function ensureEmptyDirectory(targetDir: string): void {
	if (!existsSync(targetDir)) {
		mkdirSync(targetDir, { recursive: true });
	}

	const existing = readdirSync(targetDir).filter((entry) => entry !== '.git' && entry !== '.DS_Store');
	if (existing.length > 0) {
		throw new Error(`Directory is not empty: ${targetDir}\n  Please use an empty directory or specify a new one.`);
	}
}

function ensureCleanWorkingTree(targetDir: string, commandText: string): void {
	const gitRootResult = spawnSync('git', ['rev-parse', '--show-toplevel'], {
		cwd: targetDir,
		encoding: 'utf-8',
	});
	if (gitRootResult.status !== 0) {
		console.warn('Git repository not detected; skipping clean working tree safety check.');
		return;
	}

	const gitRoot = gitRootResult.stdout.trim();
	const statusResult = spawnSync('git', ['status', '--porcelain'], {
		cwd: gitRoot,
		encoding: 'utf-8',
	});
	if (statusResult.status !== 0) {
		throw new Error(statusResult.stderr.trim() || 'Failed to inspect git working tree.');
	}
	if (statusResult.stdout.trim()) {
		throw new Error(
			`Error: \`${commandText}\` replaces existing scaffold files and requires a clean git working tree.\n` +
				'  Commit or stash your changes first, then run the command again.',
		);
	}
}

function writeRootPackage(targetDir: string, projectName: string): void {
	copyTemplateFile(join(templatesDir, 'package.template.json'), join(targetDir, 'package.json'), projectName);
	console.log('  Created package.json');
}

function writeReadme(targetDir: string, projectName: string): void {
	const readmeTemplate = readFileSync(join(templatesDir, 'README.md'), 'utf-8');
	writeFileSync(join(targetDir, 'README.md'), readmeTemplate.replaceAll('{{PROJECT_NAME}}', projectName));
	console.log('  Created README.md');
}

function writeEnvFiles(targetDir: string): void {
	copyFileSync(join(templatesDir, '.env.example'), join(targetDir, '.env.example'));
	copyFileSync(join(templatesDir, '.env.example'), join(targetDir, '.env'));
	console.log('  Created .env.example');
	console.log('  Created .env');
}

function writeGitignore(targetDir: string): void {
	copyFileSync(join(templatesDir, 'gitignore'), join(targetDir, '.gitignore'));
	console.log('  Created .gitignore');
}

function writeWorkflows(targetDir: string): void {
	cpSync(join(templatesDir, '.github'), join(targetDir, '.github'), { recursive: true });
	console.log('  Created .github/workflows/collect-skills.yml');
	console.log('  Created .github/workflows/deploy-cloudflare-pages.yml');
	console.log('  Created .github/workflows/deploy-github-pages.yml');
	console.log('    - workflow name: CollectSkills');
	console.log('    - uses Harbor reusable workflow pinned to wf-v0');
	console.log('    - workflow name: DeployCloudflarePages');
	console.log('    - workflow name: DeployGitHubPages');
	console.log('    - enable workflow_run in exactly one deploy workflow');
	console.log('    - Cloudflare Pages uses CLOUDFLARE_PW_<USERNAME> secrets');
}

function writeConfig(targetDir: string): void {
	cpSync(join(templatesDir, 'config'), join(targetDir, 'config'), { recursive: true });
	console.log('  Created config/harbor.yaml');
	console.log('  Created config/governance.yaml');
}

function writeData(targetDir: string): void {
	cpSync(join(templatesDir, 'data'), join(targetDir, 'data'), { recursive: true });
	console.log('  Created data/');
}

function writeGuide(targetDir: string): void {
	cpSync(join(templatesDir, 'guide'), join(targetDir, 'guide'), { recursive: true });
	console.log('  Created guide/');
}

function writeToolPackages(targetDir: string, projectName: string): void {
	const toolTemplateFiles = [
		'tools/harbor/collector/package.template.json',
		'tools/harbor/post-collect/package.template.json',
		'tools/harbor/web/package.template.json',
	];

	for (const templatePath of toolTemplateFiles) {
		const source = join(templatesDir, templatePath);
		const output = join(targetDir, templatePath.replace('.template', ''));
		copyTemplateFile(source, output, projectName);
	}
	console.log('  Created tools/harbor/collector/package.json');
	console.log('  Created tools/harbor/post-collect/package.json');
	console.log('  Created tools/harbor/web/package.json');
}

function replaceWorkflows(targetDir: string): void {
	rmSync(join(targetDir, '.github', 'workflows'), { recursive: true, force: true });
	cpSync(join(templatesDir, '.github', 'workflows'), join(targetDir, '.github', 'workflows'), { recursive: true });
	console.log('  Updated workflows');
}

function replaceConfig(targetDir: string): void {
	rmSync(join(targetDir, 'config'), { recursive: true, force: true });
	cpSync(join(templatesDir, 'config'), join(targetDir, 'config'), { recursive: true });
	console.log('  Updated config');
}

function printNextSteps(targetArg?: string): void {
	console.log(`
Done! Next steps:

  1. cd ${targetArg || '.'}
  2. Edit .env: uncomment and set GH_TOKEN, GH_ORG, if needed
  3. Install dependencies:
     pnpm install   (or npm install)
  4. Collect skills from your organization:
     pnpm collect   (or npx harbor collect)
  5. Start development server:
     pnpm dev       (or npx harbor dev)
  6. GitHub Actions install scoped dependencies from tools/harbor/*
`);
}

export async function runCommand(argv = process.argv.slice(3)): Promise<void> {
	let options: InitOptions;
	try {
		options = parseArgs(argv);
	} catch (error: unknown) {
		console.error(error instanceof Error ? error.message : String(error));
		console.error(INIT_USAGE);
		process.exit(1);
		return;
	}

	const projectName = basename(options.targetDir);
	const commandText = `harbor init${argv.length ? ` ${argv.join(' ')}` : ''}`;

	console.log(`\nInitializing Agent Skill Harbor project: ${projectName}`);
	console.log(`  Directory: ${options.targetDir}\n`);

	try {
		if (hasCategoryMode(options)) {
			if (!existsSync(options.targetDir)) {
				throw new Error(`Directory does not exist: ${options.targetDir}`);
			}
			ensureCleanWorkingTree(options.targetDir, commandText);
			if (options.workflows) {
				replaceWorkflows(options.targetDir);
			}
			if (options.config) {
				replaceConfig(options.targetDir);
			}
			return;
		}

		ensureEmptyDirectory(options.targetDir);
		writeRootPackage(options.targetDir, projectName);
		writeReadme(options.targetDir, projectName);
		writeEnvFiles(options.targetDir);
		writeGitignore(options.targetDir);
		writeWorkflows(options.targetDir);
		writeConfig(options.targetDir);
		writeData(options.targetDir);
		writeGuide(options.targetDir);
		writeToolPackages(options.targetDir, projectName);
		printNextSteps(argv[0]);
	} catch (error: unknown) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}
