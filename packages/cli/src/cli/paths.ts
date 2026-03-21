import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Root of the installed CLI package (where dist/, templates/ live) */
export const packageRoot = resolve(__dirname, '../..');

/** The user's project directory (CWD) */
export const userRoot = process.env.SKILL_HARBOR_USER_ROOT || process.cwd();
