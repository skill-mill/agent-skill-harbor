import { resolve, basename, join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, cpSync, copyFileSync, writeFileSync } from 'node:fs';
import { packageRoot } from '../paths.js';

const args = process.argv.slice(3);
const targetDir = args[0] ? resolve(process.cwd(), args[0]) : process.cwd();
const projectName = basename(targetDir);
const templatesDir = resolve(packageRoot, 'templates');

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
writeFileSync(join(targetDir, 'package.json'), pkgTemplate.replace('{{PROJECT_NAME}}', projectName));
console.log('  Created package.json');

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
console.log('  Created .github/workflows/deploy-pages.yml');

// config/
cpSync(join(templatesDir, 'config'), join(targetDir, 'config'), { recursive: true });
console.log('  Created config/admin.yaml');
console.log('  Created config/governance.yaml');

// data/
cpSync(join(templatesDir, 'data'), join(targetDir, 'data'), { recursive: true });
console.log('  Created data/');

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
`);
