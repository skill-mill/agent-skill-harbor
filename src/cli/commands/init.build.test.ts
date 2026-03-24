import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'tsup';

class ExitSignal extends Error {
	constructor(readonly code: number) {
		super(`process.exit(${code})`);
	}
}

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

async function buildPackage(): Promise<void> {
	const config = (await import(pathToFileURL(join(packageRoot, 'tsup.config.ts')).href)).default;
	await build(config);
}

async function invokeBuiltRunCommand(args: string[], cwd: string) {
	const originalCwd = process.cwd();
	const originalExit = process.exit;
	const originalWarn = console.warn;
	const originalError = console.error;
	const warnings: string[] = [];
	const errors: string[] = [];
	const builtInit = await import(pathToFileURL(join(packageRoot, 'dist', 'src', 'cli', 'commands', 'init.js')).href);

	process.chdir(cwd);
	console.warn = (...values: unknown[]) => warnings.push(values.join(' '));
	console.error = (...values: unknown[]) => errors.push(values.join(' '));
	process.exit = ((code?: number) => {
		throw new ExitSignal(code ?? 0);
	}) as typeof process.exit;

	try {
		await builtInit.runCommand(args);
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

test('built harbor init resolves the package root from dist command output', async () => {
	await buildPackage();

	const root = mkdtempSync(join(tmpdir(), 'harbor-init-built-'));
	const target = join(root, 'project');
	const result = await invokeBuiltRunCommand([target], root);

	assert.equal(result.status, 0, result.errors.join('\n'));
	assert.equal(existsSync(join(target, 'package.json')), true);
	assert.equal(existsSync(join(target, 'collector', 'package.json')), true);
	assert.equal(existsSync(join(target, '.github', 'workflows', 'collect-skills.yml')), true);
	assert.match(readFileSync(join(target, 'package.json'), 'utf-8'), /"agent-skill-harbor": ">=0\./);
});
