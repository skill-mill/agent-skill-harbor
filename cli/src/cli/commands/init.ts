import { resolve, basename, join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, cpSync, copyFileSync, writeFileSync } from 'node:fs';
import { packageRoot } from '../paths.js';

const args = process.argv.slice(3);
const targetDir = args[0] ? resolve(process.cwd(), args[0]) : process.cwd();
const projectName = basename(targetDir);
const templatesDir = resolve(packageRoot, 'templates/init');
const cliPackageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf-8')) as {
	version: string;
	peerDependencies?: Record<string, string>;
};
const packageVersion = cliPackageJson.version;

function getPeerDependencyVersion(packageName: string): string {
	const version = cliPackageJson.peerDependencies?.[packageName];
	if (!version) {
		throw new Error(`Missing peer dependency version for ${packageName} in cli/package.json`);
	}
	return version;
}

const collectorVersion = getPeerDependencyVersion('agent-skill-harbor-collector');
const postCollectVersion = getPeerDependencyVersion('agent-skill-harbor-post-collect');
const webVersion = getPeerDependencyVersion('agent-skill-harbor-web');

console.log(`\nInitializing Agent Skill Harbor project: ${projectName}`);
console.log(`  Directory: ${targetDir}\n`);

// Create target directory if it doesn't exist
if (!existsSync(targetDir)) {
	mkdirSync(targetDir, { recursive: true });
}

// Check if directory is empty (allow .git)
const existing = (await import('node:fs'))
	.readdirSync(targetDir)
	.filter((f: string) => f !== '.git' && f !== '.DS_Store');
if (existing.length > 0) {
	console.error(`Error: Directory is not empty: ${targetDir}`);
	console.error('  Please use an empty directory or specify a new one.');
	process.exit(1);
}

// package.json (template is named 'package.template.json' to avoid pnpm workspace issues)
const pkgTemplate = readFileSync(join(templatesDir, 'package.template.json'), 'utf-8');
writeFileSync(
	join(targetDir, 'package.json'),
	pkgTemplate
		.replace('{{PROJECT_NAME}}', projectName)
		.replaceAll('{{PACKAGE_VERSION}}', packageVersion)
		.replaceAll('{{COLLECTOR_VERSION}}', collectorVersion)
		.replaceAll('{{POST_COLLECT_VERSION}}', postCollectVersion)
		.replaceAll('{{WEB_VERSION}}', webVersion),
);
console.log('  Created package.json');

// README
const readmeTemplate = readFileSync(join(templatesDir, 'README.md'), 'utf-8');
writeFileSync(join(targetDir, 'README.md'), readmeTemplate.replaceAll('{{PROJECT_NAME}}', projectName));
console.log('  Created README.md');

// env files
copyFileSync(join(templatesDir, '.env.example'), join(targetDir, '.env.example'));
copyFileSync(join(templatesDir, '.env.example'), join(targetDir, '.env'));
console.log('  Created .env.example');
console.log('  Created .env');

// .gitignore (template is named 'gitignore' to avoid npm publish issues)
copyFileSync(join(templatesDir, 'gitignore'), join(targetDir, '.gitignore'));
console.log('  Created .gitignore');

// .github/workflows/
cpSync(join(templatesDir, '.github'), join(targetDir, '.github'), { recursive: true });
console.log('  Created .github/workflows/collect-skills.yml');
console.log('  Created .github/workflows/deploy-cloudflare-pages.yml');
console.log('  Created .github/workflows/deploy-github-pages.yml');
console.log('    - workflow name: CollectSkills');
console.log('    - workflow name: DeployCloudflarePages');
console.log('    - workflow name: DeployGitHubPages');
console.log('    - enable workflow_run in exactly one deploy workflow');
console.log('    - Cloudflare Pages uses CLOUDFLARE_PW_<USERNAME> secrets');

// config/
cpSync(join(templatesDir, 'config'), join(targetDir, 'config'), { recursive: true });
console.log('  Created config/harbor.yaml');
console.log('  Created config/governance.yaml');

// data/
cpSync(join(templatesDir, 'data'), join(targetDir, 'data'), { recursive: true });
console.log('  Created data/');

// guide/
cpSync(join(templatesDir, 'guide'), join(targetDir, 'guide'), { recursive: true });
console.log('  Created guide/');

// tools/harbor/
const toolTemplateFiles = [
	'tools/harbor/collector/package.template.json',
	'tools/harbor/post-collect/package.template.json',
	'tools/harbor/web/package.template.json',
];
for (const templatePath of toolTemplateFiles) {
	const source = join(templatesDir, templatePath);
	const output = join(targetDir, templatePath.replace('.template', ''));
	const content = readFileSync(source, 'utf-8')
		.replaceAll('{{PACKAGE_VERSION}}', packageVersion)
		.replaceAll('{{COLLECTOR_VERSION}}', collectorVersion)
		.replaceAll('{{POST_COLLECT_VERSION}}', postCollectVersion)
		.replaceAll('{{WEB_VERSION}}', webVersion);
	mkdirSync(resolve(output, '..'), { recursive: true });
	writeFileSync(output, content);
}
console.log('  Created tools/harbor/collector/package.json');
console.log('  Created tools/harbor/post-collect/package.json');
console.log('  Created tools/harbor/web/package.json');

console.log(`
Done! Next steps:

  1. cd ${args[0] || '.'}
  2. Edit .env: uncomment and set GH_TOKEN, GH_ORG, if needed
  3. Install dependencies:
     pnpm install   (or npm install)
  4. Collect skills from your organization:
     pnpm collect   (or npx harbor collect)
  5. Start development server:
     pnpm dev       (or npx harbor dev)
  6. GitHub Actions install scoped dependencies from tools/harbor/*
`);
