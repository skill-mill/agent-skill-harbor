import { derived, writable } from 'svelte/store';
import en from './en.json';
import ja from './ja.json';

export type Locale = 'en' | 'ja';

const messages: Record<Locale, Record<string, unknown>> = { en, ja };

export const locale = writable<Locale>('en');

function resolve(obj: unknown, path: string): string | undefined {
	const keys = path.split('.');
	let current: unknown = obj;
	for (const key of keys) {
		if (current == null || typeof current !== 'object') return undefined;
		current = (current as Record<string, unknown>)[key];
	}
	return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key) => (params[key] != null ? String(params[key]) : `{${key}}`));
}

export const t = derived(locale, ($locale) => {
	return (key: string, params?: Record<string, string | number>): string => {
		// Plural form: if params.count exists, try _one / _other suffix
		if (params && 'count' in params) {
			const count = Number(params.count);
			const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
			const plural = resolve(messages[$locale], pluralKey) ?? resolve(messages.en, pluralKey);
			if (plural) {
				return interpolate(plural, params);
			}
		}

		const value = resolve(messages[$locale], key) ?? resolve(messages.en, key) ?? key;
		return params ? interpolate(value, params) : value;
	};
});

export function setLocale(loc: Locale): void {
	localStorage.setItem('locale', loc);
	document.documentElement.lang = loc;
	locale.set(loc);
}

export function initLocale(): void {
	const stored = localStorage.getItem('locale');
	const loc: Locale = stored === 'ja' ? 'ja' : 'en';
	locale.set(loc);
	document.documentElement.lang = loc;
}
