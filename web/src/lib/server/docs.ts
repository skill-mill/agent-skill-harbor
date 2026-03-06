import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

declare const __PROJECT_ROOT__: string;

const DOCS_DIR = join(__PROJECT_ROOT__, 'docs');

export interface DocEntry {
	slug: string;
	title: Record<string, string>;
}

function extractTitle(content: string): string {
	const match = content.match(/^#\s+(.+)$/m);
	return match ? match[1].trim() : '';
}

/**
 * Scan docs/ directory and return a sorted list of doc entries.
 * Excludes *_ja.md, dev/ subdirectory files, etc.
 */
export function listDocs(): DocEntry[] {
	if (!existsSync(DOCS_DIR)) return [];

	const files = readdirSync(DOCS_DIR)
		.filter((f) => f.endsWith('.md') && !f.includes('_') && !f.startsWith('.'))
		.sort();

	const entries: DocEntry[] = [];

	for (const file of files) {
		const slug = file.replace(/\.md$/, '');
		const enPath = join(DOCS_DIR, file);
		const jaPath = join(DOCS_DIR, `${slug}_ja.md`);

		const enContent = readFileSync(enPath, 'utf-8');
		const enTitle = extractTitle(enContent) || slug;

		let jaTitle = enTitle;
		if (existsSync(jaPath)) {
			const jaContent = readFileSync(jaPath, 'utf-8');
			jaTitle = extractTitle(jaContent) || enTitle;
		}

		entries.push({ slug, title: { en: enTitle, ja: jaTitle } });
	}

	return entries;
}

/**
 * Load markdown content for a given slug and locale.
 * Returns the content with the `# heading` line stripped (title is provided separately).
 */
export function loadDocContent(slug: string, locale: string): string | null {
	const localized = join(DOCS_DIR, `${slug}_${locale}.md`);
	const fallback = join(DOCS_DIR, `${slug}.md`);
	const filePath = locale !== 'en' && existsSync(localized) ? localized : fallback;

	if (!existsSync(filePath)) return null;

	const content = readFileSync(filePath, 'utf-8');
	// Strip the first `# heading` line — title is rendered separately
	return content.replace(/^#\s+.+\n+/, '');
}
