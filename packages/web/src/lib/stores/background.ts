import { writable } from 'svelte/store';

export type BackgroundMode = 'none' | 'stars' | 'ripples';

const VALID_MODES: Set<string> = new Set(['none', 'stars', 'ripples']);

export const background = writable<BackgroundMode>('stars');

export function setBackground(mode: BackgroundMode): void {
	localStorage.setItem('background', mode);
	background.set(mode);
}

export function initBackground(): void {
	const stored = localStorage.getItem('background');
	const mode: BackgroundMode = stored && VALID_MODES.has(stored) ? (stored as BackgroundMode) : 'stars';
	background.set(mode);
}
