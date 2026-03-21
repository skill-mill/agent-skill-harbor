function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function splitTrailingComment(line: string): { body: string; comment: string | null } {
	let inSingle = false;
	let inDouble = false;
	for (let i = 0; i < line.length; i += 1) {
		const char = line[i];
		const prev = i > 0 ? line[i - 1] : '';
		if (char === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
		if (char === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
		if (char === '#' && !inSingle && !inDouble) {
			return {
				body: line.slice(0, i),
				comment: line.slice(i),
			};
		}
	}
	return { body: line, comment: null };
}

export function highlightYamlLine(line: string): string {
	const trimmed = line.trimStart();
	if (trimmed.startsWith('#')) {
		return `<span class="text-gray-500 dark:text-gray-400">${escapeHtml(line)}</span>`;
	}

	const { body, comment } = splitTrailingComment(line);
	const bodyMatch = body.match(/^(\s*)(-\s+)?([^:#][^:]*?)(\s*:\s*)(.*)$/);
	let bodyHtml = escapeHtml(body);
	if (bodyMatch) {
		const [, indent = '', dash = '', key = '', separator = '', value = ''] = bodyMatch;
		bodyHtml = [
			escapeHtml(indent),
			dash ? `<span class="text-amber-300 dark:text-amber-400">${escapeHtml(dash)}</span>` : '',
			`<span class="text-sky-300 dark:text-sky-400">${escapeHtml(key)}</span>`,
			`<span class="text-gray-400 dark:text-gray-500">${escapeHtml(separator)}</span>`,
			escapeHtml(value),
		].join('');
	}

	if (!comment) return bodyHtml;
	return `${bodyHtml}<span class="text-gray-500 dark:text-gray-400">${escapeHtml(comment)}</span>`;
}

export function highlightYamlLines(content: string | null): string[] {
	return content?.split('\n').map(highlightYamlLine) ?? [];
}
