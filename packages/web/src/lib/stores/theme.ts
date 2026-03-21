import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'system';

export const theme = writable<ThemeMode>('system');

function applyTheme(mode: ThemeMode): void {
	const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', dark);
}

export function setTheme(mode: ThemeMode): void {
	localStorage.setItem('theme', mode);
	theme.set(mode);
	applyTheme(mode);
}

export function initTheme(): void {
	const stored = localStorage.getItem('theme') as ThemeMode | null;
	const mode: ThemeMode = stored === 'light' || stored === 'dark' ? stored : 'system';
	theme.set(mode);
	applyTheme(mode);

	matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		const current = localStorage.getItem('theme');
		if (!current || current === 'system') {
			applyTheme('system');
		}
	});
}
