import { resolve } from 'node:path';

export const userRoot = resolve(process.env.SKILL_HARBOR_PROJECT_ROOT || process.cwd());
