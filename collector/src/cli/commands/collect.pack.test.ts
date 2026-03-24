import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'tsup';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

async function buildPackage(): Promise<void> {
	const config = (await import(pathToFileURL(join(packageRoot, 'tsup.config.ts')).href)).default;
	await build(config);
}

test('packed collector bundle does not publish shared-internal as a runtime dependency', async () => {
	await buildPackage();

	const packDir = mkdtempSync(join(tmpdir(), 'collector-pack-'));
	const packResult = JSON.parse(
		execFileSync('pnpm', ['pack', '--pack-destination', packDir, '--json'], {
			cwd: packageRoot,
			encoding: 'utf-8',
		}),
	) as { filename: string };
	const tarballPath = isAbsolute(packResult.filename) ? packResult.filename : join(packDir, packResult.filename);
	const packedPackageJson = JSON.parse(
		execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], {
			encoding: 'utf-8',
		}),
	) as { dependencies?: Record<string, string> };
	const builtCollect = readFileSync(join(packageRoot, 'dist', 'src', 'cli', 'commands', 'collect.js'), 'utf-8');

	assert.equal(packedPackageJson.dependencies?.['agent-skill-harbor-shared-internal'], undefined);
	assert.equal(builtCollect.includes('agent-skill-harbor-shared-internal'), false);
});
