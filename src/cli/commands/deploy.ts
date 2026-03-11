import { execFileSync } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { packageRoot, userRoot } from '../paths.js';

const args = process.argv.slice(3);
const provider = args[0];
const optionArgs = args.slice(1);

if (provider !== 'cloudflare-pages') {
	console.error('Error: supported deploy targets: cloudflare-pages');
	process.exit(1);
}

const projectName =
	optionArgs.find((arg) => arg.startsWith('--project-name='))?.split('=')[1] ||
	process.env.CLOUDFLARE_PAGES_PROJECT_NAME;

if (!projectName) {
	console.error('Error: CLOUDFLARE_PAGES_PROJECT_NAME or --project-name is required.');
	process.exit(1);
}

const buildScript = resolve(packageRoot, 'dist/src/cli/commands/build.js');
const buildDir = resolve(userRoot, 'build');
const wranglerArgs = ['wrangler@4', 'pages', 'deploy', buildDir, `--project-name=${projectName}`];

console.log(`Deploying to Cloudflare Pages...`);
console.log(`  Project root: ${userRoot}`);
console.log(`  Project name: ${projectName}`);

try {
	execFileSync(process.execPath, [buildScript], {
		cwd: userRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			SKILL_HARBOR_ROOT: userRoot,
		},
	});
} catch (e: any) {
	process.exit(e.status ?? 1);
}

if (!existsSync(buildDir)) {
	console.error(`Error: build output not found: ${buildDir}`);
	process.exit(1);
}

// Copy Cloudflare Pages middleware from package templates into build output
const functionsSource = resolve(packageRoot, 'templates/deploy/cloudflare-pages/functions');
if (existsSync(functionsSource)) {
	cpSync(functionsSource, resolve(buildDir, 'functions'), { recursive: true });
	console.log('  Injected functions/_middleware.js from package');
}

try {
	execFileSync('npx', wranglerArgs, {
		cwd: userRoot,
		stdio: 'inherit',
		env: process.env,
	});
} catch (e: any) {
	process.exit(e.status ?? 1);
}
