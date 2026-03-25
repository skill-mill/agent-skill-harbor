/**
 * Set up local development environment for source repo contributors.
 *
 * Steps:
 *   1. templates/init/.env.example → .env
 *   2. Download demo repo archive
 *   3. Copy demo repo config/, data/, guide/ → project root
 */
import { execFileSync } from 'node:child_process';
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const DEMO_OWNER = 'skill-mill';
const DEMO_REPO = 'agent-skill-harbor-demo';
const DEMO_REF = 'main';
const DEMO_ARCHIVE_URL = `https://codeload.github.com/${DEMO_OWNER}/${DEMO_REPO}/tar.gz/refs/heads/${DEMO_REF}`;
const DEMO_COPY_DIRS = ['config', 'data', 'guide'] as const;

const projectRoot = resolve(import.meta.dirname, '..');
const templatesDir = join(projectRoot, 'templates', 'init');

function logStep(message: string) {
	console.log(`  ${message}`);
}

function copyDirectory(sourceDir: string, destDir: string) {
	if (!existsSync(sourceDir)) {
		throw new Error(`Expected demo directory does not exist: ${sourceDir}`);
	}
	rmSync(destDir, { force: true, recursive: true });
	cpSync(sourceDir, destDir, { recursive: true });
}

async function downloadDemoArchive(archivePath: string) {
	const response = await fetch(DEMO_ARCHIVE_URL, {
		headers: { 'user-agent': 'agent-skill-harbor-setup-dev' },
	});
	if (!response.ok) {
		throw new Error(`Failed to download demo archive: ${response.status} ${response.statusText}`);
	}

	const archiveBuffer = Buffer.from(await response.arrayBuffer());
	writeFileSync(archivePath, archiveBuffer);
}

function findExtractedRoot(extractDir: string) {
	const extractedEntry = readdirSync(extractDir, { withFileTypes: true }).find((entry) => entry.isDirectory());
	if (!extractedEntry) {
		throw new Error('Failed to locate extracted demo archive root directory.');
	}
	return join(extractDir, extractedEntry.name);
}

console.log('\nSetting up local development environment...\n');

if (!existsSync(join(projectRoot, '.env'))) {
	copyFileSync(join(templatesDir, '.env.example'), join(projectRoot, '.env'));
	logStep('Created .env from templates/init/.env.example');
} else {
	logStep('Skipped .env (already exists)');
}

const tempRoot = join(tmpdir(), `agent-skill-harbor-setup-dev-${process.pid}`);
const archivePath = join(tempRoot, `${DEMO_REPO}.tar.gz`);
const extractDir = join(tempRoot, 'extract');

rmSync(tempRoot, { force: true, recursive: true });
mkdirSync(extractDir, { recursive: true });

try {
	logStep(`Downloading demo archive from ${DEMO_OWNER}/${DEMO_REPO}@${DEMO_REF}`);
	await downloadDemoArchive(archivePath);

	logStep('Extracting demo archive');
	execFileSync('tar', ['-xzf', archivePath, '-C', extractDir], { stdio: 'inherit' });

	const extractedRoot = findExtractedRoot(extractDir);
	for (const dirName of DEMO_COPY_DIRS) {
		const sourceDir = join(extractedRoot, dirName);
		const destDir = join(projectRoot, dirName);
		copyDirectory(sourceDir, destDir);
		logStep(`Copied demo ${dirName}/ → ${dirName}/`);
	}
} finally {
	rmSync(tempRoot, { force: true, recursive: true });
}

console.log(
	'\nDone! Edit .env (uncomment and set GH_TOKEN, GH_ORG) and run from the repository root:\n' +
			'  pnpm cli:build\n' +
		'  pnpm --dir collector build\n' +
		'  GH_TOKEN=$(gh auth token) node collector/dist/bin/collector.js collect\n' +
		"  COLLECT_ID=$(grep -m1 '^- collect_id:' data/collects.yaml | sed 's/^- collect_id: //')\n" +
		'  node collector/dist/bin/collector.js post-collect --collect-id "$COLLECT_ID"\n' +
		'  pnpm dev\n',
);
