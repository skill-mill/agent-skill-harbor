import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Root of the installed npm package (where web/, templates/ live) */
export const packageRoot = resolve(__dirname, '../..');

/** The SvelteKit app source directory */
export const webRoot = resolve(packageRoot, 'web');

/** The user's project directory (CWD) */
export const userRoot = process.cwd();
