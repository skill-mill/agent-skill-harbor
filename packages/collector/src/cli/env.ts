import { existsSync, readFileSync } from 'node:fs';

export function loadOptionalEnvFile(filePath: string): void {
	if (!existsSync(filePath)) {
		return;
	}

	for (const rawLine of readFileSync(filePath, 'utf-8').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
		const separator = normalized.indexOf('=');
		if (separator <= 0) continue;

		const key = normalized.slice(0, separator).trim();
		if (!key || process.env[key] !== undefined) continue;

		let value = normalized.slice(separator + 1).trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}

		process.env[key] = value.replace(/\\n/g, '\n');
	}
}
