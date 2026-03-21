import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

export const webRoot = resolve(__dirname, '../..');
export const userRoot = process.env.SKILL_HARBOR_USER_ROOT || process.cwd();
export const packageRoot = webRoot;
