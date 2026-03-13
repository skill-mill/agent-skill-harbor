import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

declare const __PROJECT_ROOT__: string;
declare const __WEB_PACKAGE_ROOT__: string;

const PROJECT_GUIDE_DIR = join(__PROJECT_ROOT__, 'guide');
const DEFAULT_GUIDE_DIR = join(__WEB_PACKAGE_ROOT__, 'guide');

const SOURCE_DIRS = [PROJECT_GUIDE_DIR, DEFAULT_GUIDE_DIR];

export interface DocEntry {
	slug: string;
	title: Record<string, string>;
}

function extractTitle(content: string): string {
	const match = content.match(/^#\s+(.+)$/m);
	return match ? match[1].trim() : '';
}

function fileExists(path: string): boolean {
	return existsSync(path);
}

function resolveIndexPath(locale: string): string | null {
	const localizedNames =
		locale === 'en'
			? ['index.md', 'README.md']
			: [`index_${locale}.md`, `${locale === 'ja' ? 'README_ja.md' : `README_${locale}.md`}`, 'index.md', 'README.md'];

	for (const dir of SOURCE_DIRS) {
		for (const name of localizedNames) {
			const candidate = join(dir, name);
			if (fileExists(candidate)) return candidate;
		}
	}

	const projectReadme =
		locale === 'en' ? join(__PROJECT_ROOT__, 'README.md') : join(__PROJECT_ROOT__, `README_${locale}.md`);
	if (fileExists(projectReadme)) return projectReadme;
	if (locale !== 'en' && fileExists(join(__PROJECT_ROOT__, 'README.md'))) return join(__PROJECT_ROOT__, 'README.md');
	return null;
}

function resolveGuidePath(slug: string, locale: string): string | null {
	if (slug === '') return resolveIndexPath(locale);

	for (const dir of SOURCE_DIRS) {
		const localized = join(dir, `${slug}_${locale}.md`);
		const fallback = join(dir, `${slug}.md`);
		if (locale !== 'en' && fileExists(localized)) return localized;
		if (fileExists(fallback)) return fallback;
	}

	return null;
}

function stripPreamble(content: string): string {
	content = content.replace(/^<p[^>]*>.*?<\/p>\s*\n*/s, '');
	return content.replace(/^#\s+.+\n+/, '');
}

function rewriteGuideLinks(content: string): string {
	return content
		.replace(/\(guide\/([^)]+?)(?:_[a-z]{2})?\.md\)/g, '(/guide/$1)')
		.replace(/\((?:\.\/)?README(?:_[a-z]{2})?\.md\)/g, '(/guide)');
}

function buildEntry(slug: string): DocEntry | null {
	const enPath = resolveGuidePath(slug, 'en');
	if (!enPath) return null;

	const enTitle = extractTitle(readFileSync(enPath, 'utf-8')) || slug || 'Guide';

	const jaPath = resolveGuidePath(slug, 'ja');
	const jaTitle = jaPath ? extractTitle(readFileSync(jaPath, 'utf-8')) || enTitle : enTitle;

	return { slug, title: { en: enTitle, ja: jaTitle } };
}

function listGuideSlugs(): string[] {
	const slugs = new Set<string>();

	for (const dir of SOURCE_DIRS) {
		if (!fileExists(dir)) continue;

		for (const file of readdirSync(dir)) {
			if (!file.endsWith('.md') || file.startsWith('.')) continue;
			if (file === 'index.md' || /^index_[a-z]{2}\.md$/.test(file)) continue;
			if (file === 'README.md' || /^README_[a-z]{2}\.md$/.test(file)) continue;

			const slug = file.replace(/(?:_[a-z]{2})?\.md$/, '');
			slugs.add(slug);
		}
	}

	return [...slugs].sort();
}

export function listDocs(): DocEntry[] {
	const entries: DocEntry[] = [];
	const rootEntry = buildEntry('');
	if (rootEntry) entries.push(rootEntry);

	for (const slug of listGuideSlugs()) {
		const entry = buildEntry(slug);
		if (entry) entries.push(entry);
	}

	return entries;
}

export function loadDocContent(slug: string, locale: string): string | null {
	const filePath = resolveGuidePath(slug, locale);
	if (!filePath) return null;

	let content = readFileSync(filePath, 'utf-8');
	content = stripPreamble(content);
	content = rewriteGuideLinks(content);
	return content;
}
