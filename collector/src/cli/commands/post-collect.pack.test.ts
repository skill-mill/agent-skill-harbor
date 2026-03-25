import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'tsup';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const buildOutDir = join(packageRoot, 'dist-pack-test-post-collect');

async function buildPackage(): Promise<void> {
	const config = (await import(pathToFileURL(join(packageRoot, 'tsup.config.ts')).href)).default;
	await build({ ...config, outDir: buildOutDir });
}

test('packed post-collect bundle does not publish shared-internal as a runtime dependency', async () => {
	try {
		await buildPackage();

		const packDir = mkdtempSync(join(tmpdir(), 'post-collect-pack-'));
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
		const builtPostCollect = readFileSync(join(buildOutDir, 'src', 'runtime', 'post-collect-command.js'), 'utf-8');

		assert.equal(packedPackageJson.dependencies?.['agent-skill-harbor-shared-internal'], undefined);
		assert.equal(builtPostCollect.includes('agent-skill-harbor-shared-internal'), false);
	} finally {
		rmSync(buildOutDir, { recursive: true, force: true });
	}
});
