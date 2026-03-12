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

/** Special docs mapped from files outside docs/ directory. */
const EXTRA_DOCS: { slug: string; en: string; ja: string }[] = [
	{ slug: '', en: join(__PROJECT_ROOT__, 'README.md'), ja: join(__PROJECT_ROOT__, 'README_ja.md') },
];

/**
 * Scan docs/ directory and return a sorted list of doc entries.
 * Excludes *_ja.md, dev/ subdirectory files, etc.
 */
export function listDocs(): DocEntry[] {
	const entries: DocEntry[] = [];

	// README as top-level entry
	for (const extra of EXTRA_DOCS) {
		if (existsSync(extra.en)) {
			entries.push({ slug: extra.slug, title: { en: 'Agent Skill Harbor', ja: 'Agent Skill Harbor' } });
		}
	}

	if (!existsSync(DOCS_DIR)) return entries;
	const files = readdirSync(DOCS_DIR)
		.filter((f) => f.endsWith('.md') && !f.includes('_') && !f.startsWith('.'))
		.sort();

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
 * Resolve the file path for a given slug and locale.
 * Checks EXTRA_DOCS first, then falls back to docs/ directory.
 */
function resolveDocPath(slug: string, locale: string): string | null {
	const extra = EXTRA_DOCS.find((e) => e.slug === slug);
	if (extra) {
		if (locale !== 'en' && existsSync(extra.ja)) return extra.ja;
		return existsSync(extra.en) ? extra.en : null;
	}

	const localized = join(DOCS_DIR, `${slug}_${locale}.md`);
	const fallback = join(DOCS_DIR, `${slug}.md`);
	if (locale !== 'en' && existsSync(localized)) return localized;
	return existsSync(fallback) ? fallback : null;
}

function stripReadmePreamble(content: string): string {
	// Strip language switcher line (e.g. `<p align="center"><a ...>en</a> | ...</p>`)
	content = content.replace(/^<p[^>]*>.*?<\/p>\s*\n*/s, '');
	// Strip the first `# heading` line — title is rendered separately
	return content.replace(/^#\s+.+\n+/, '');
}

/**
 * Load markdown content for a given slug and locale.
 * Returns the content with the `# heading` line stripped (title is provided separately).
 */
export function loadDocContent(slug: string, locale: string): string | null {
	const filePath = resolveDocPath(slug, locale);
	if (!filePath) return null;

	const content = readFileSync(filePath, 'utf-8');
	return stripReadmePreamble(content);
}
