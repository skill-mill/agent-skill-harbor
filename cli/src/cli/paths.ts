import { createRequire } from 'node:module';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Root of the installed CLI package (where dist/, templates/ live) */
export const packageRoot = resolve(__dirname, '../..');

/** Root of the installed web package */
export const webPackageRoot = dirname(require.resolve('agent-skill-harbor-web/package.json'));

/** Resolve dependencies from the installed web package */
export const webPackageRequire = createRequire(join(webPackageRoot, 'package.json'));

/** The SvelteKit app source directory */
export const webRoot = webPackageRoot;

/** The user's project directory (CWD) */
export const userRoot = process.cwd();
