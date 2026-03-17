/**
 * Set up local development environment by copying templates and fixtures.
 * This is for source repo contributors only, not for end users.
 *
 * Steps:
 *   1. cli/templates/init/.env.example → .env
 *   2. cli/templates/init/config/*     → config/
 *   3. fixtures/config/*            → config/  (overwrites with sample governance)
 *   4. fixtures/data/*              → data/
 */
import { join, resolve } from 'node:path';
import { existsSync, cpSync, copyFileSync } from 'node:fs';

const projectRoot = resolve(import.meta.dirname, '..');
const templatesDir = join(projectRoot, 'cli', 'templates/init');
const fixturesDir = join(projectRoot, 'fixtures');

console.log('\nSetting up local development environment...\n');

// 1. .env
if (!existsSync(join(projectRoot, '.env'))) {
	copyFileSync(join(templatesDir, '.env.example'), join(projectRoot, '.env'));
	console.log('  Created .env from cli/templates/init/.env.example');
} else {
	console.log('  Skipped .env (already exists)');
}

// 2. templates/config/
cpSync(join(templatesDir, 'config'), join(projectRoot, 'config'), { recursive: true });
console.log('  Copied templates/config/ → config/');

// 3. fixtures/config/ (overwrites with sample governance policies)
cpSync(join(fixturesDir, 'config'), join(projectRoot, 'config'), { recursive: true });
console.log('  Copied fixtures/config/ → config/');

// 4. fixtures/data/
cpSync(join(fixturesDir, 'data'), join(projectRoot, 'data'), { recursive: true });
console.log('  Copied fixtures/data/ → data/');

console.log(
	'\nDone! Edit .env (uncomment and set GH_TOKEN, GH_ORG) and run from the repository root:\n' +
		'  pnpm --dir cli build\n' +
		'  GH_TOKEN=$(gh auth token) node cli/dist/bin/cli.js collect\n' +
		'  node cli/dist/bin/cli.js post-collect --collect-id <collect_id>\n' +
		'  tsx cli/bin/cli.ts dev\n',
);
