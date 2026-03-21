import { createPersistentStore } from './persistent';

export type ThemeMode = 'light' | 'dark' | 'system';

function applyTheme(mode: ThemeMode): void {
	const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', dark);
}

export const theme = createPersistentStore<ThemeMode>({
	key: 'theme',
	defaultValue: 'system',
	parse(stored): ThemeMode {
		return stored === 'light' || stored === 'dark' ? stored : 'system';
	},
	onChange: applyTheme,
});

export const setTheme = theme.set;

export function initTheme(): void {
	theme.init();

	matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		const current = localStorage.getItem('theme');
		if (!current || current === 'system') {
			applyTheme('system');
		}
	});
}
