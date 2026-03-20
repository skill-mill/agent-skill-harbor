import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runCommand } from './init.js';

class ExitSignal extends Error {
	constructor(readonly code: number) {
		super(`process.exit(${code})`);
	}
}

async function invokeRunCommand(args: string[], cwd: string) {
	const originalCwd = process.cwd();
	const originalExit = process.exit;
	const originalWarn = console.warn;
	const originalError = console.error;
	const warnings: string[] = [];
	const errors: string[] = [];

	process.chdir(cwd);
	console.warn = (...values: unknown[]) => warnings.push(values.join(' '));
	console.error = (...values: unknown[]) => errors.push(values.join(' '));
	process.exit = ((code?: number) => {
		throw new ExitSignal(code ?? 0);
	}) as typeof process.exit;

	try {
		await runCommand(args);
		return { status: 0, warnings, errors };
	} catch (error) {
		if (error instanceof ExitSignal) {
			return { status: error.code, warnings, errors };
		}
		throw error;
	} finally {
		process.chdir(originalCwd);
		process.exit = originalExit;
		console.warn = originalWarn;
		console.error = originalError;
	}
}

function initGitRepo(dir: string): void {
	execFileSync('git', ['init'], { cwd: dir });
	execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: dir });
	execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
}

function commitAll(dir: string, message: string): void {
	execFileSync('git', ['add', '.'], { cwd: dir });
	execFileSync('git', ['commit', '-m', message], { cwd: dir });
}

test('harbor init scaffolds a new project into an empty directory', async () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-init-'));
	const target = join(root, 'project');

	const result = await invokeRunCommand([target], root);

	assert.equal(result.status, 0, result.errors.join('\n'));
	assert.equal(existsSync(join(target, 'package.json')), true);
	assert.equal(existsSync(join(target, '.github', 'workflows', 'collect-skills.yml')), true);
	assert.match(readFileSync(join(target, 'package.json'), 'utf-8'), /"agent-skill-harbor": ">=0\.13\.0 <1"/);
	assert.match(
		readFileSync(join(target, '.github', 'workflows', 'collect-skills.yml'), 'utf-8'),
		/collect\.yml@wf-v0/,
	);
});

test('harbor init --workflows replaces the workflow directory contents', async () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-init-workflows-'));
	mkdirSync(join(root, '.github', 'workflows'), { recursive: true });
	writeFileSync(join(root, '.github', 'workflows', 'old-workflow.yml'), 'name: OldWorkflow\n');
	writeFileSync(join(root, 'README.md'), '# keep\n');
	initGitRepo(root);
	commitAll(root, 'initial');

	const result = await invokeRunCommand(['.', '--workflows'], root);

	assert.equal(result.status, 0, result.errors.join('\n'));
	assert.equal(existsSync(join(root, '.github', 'workflows', 'old-workflow.yml')), false);
	assert.equal(existsSync(join(root, '.github', 'workflows', 'collect-skills.yml')), true);
	assert.equal(readFileSync(join(root, 'README.md'), 'utf-8'), '# keep\n');
});

test('harbor init --config replaces scaffold config files', async () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-init-config-'));
	mkdirSync(join(root, 'config'), { recursive: true });
	writeFileSync(join(root, 'config', 'harbor.yaml'), 'old: true\n');
	writeFileSync(join(root, 'config', 'governance.yaml'), 'old: true\n');
	initGitRepo(root);
	commitAll(root, 'initial');

	const result = await invokeRunCommand(['.', '--config'], root);

	assert.equal(result.status, 0, result.errors.join('\n'));
	assert.equal(readFileSync(join(root, 'config', 'harbor.yaml'), 'utf-8').includes('post_collect:'), true);
	assert.equal(readFileSync(join(root, 'config', 'governance.yaml'), 'utf-8').includes('policies:'), true);
});

test('harbor init --workflows fails when git working tree is dirty', async () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-init-dirty-'));
	mkdirSync(join(root, '.github', 'workflows'), { recursive: true });
	writeFileSync(join(root, '.github', 'workflows', 'old-workflow.yml'), 'name: OldWorkflow\n');
	initGitRepo(root);
	commitAll(root, 'initial');
	writeFileSync(join(root, 'dirty.txt'), 'dirty\n');

	const result = await invokeRunCommand(['.', '--workflows'], root);

	assert.equal(result.status, 1);
	assert.match(result.errors.join('\n'), /harbor init \. --workflows/);
	assert.match(result.errors.join('\n'), /requires a clean git working tree/);
});

test('harbor init --workflows warns and proceeds outside a git repository', async () => {
	const root = mkdtempSync(join(tmpdir(), 'harbor-init-nogit-'));
	mkdirSync(join(root, '.github', 'workflows'), { recursive: true });
	writeFileSync(join(root, '.github', 'workflows', 'old-workflow.yml'), 'name: OldWorkflow\n');

	const result = await invokeRunCommand(['.', '--workflows'], root);

	assert.equal(result.status, 0, result.errors.join('\n'));
	assert.match(result.warnings.join('\n'), /Git repository not detected; skipping clean working tree safety check\./);
	assert.equal(existsSync(join(root, '.github', 'workflows', 'collect-skills.yml')), true);
});
