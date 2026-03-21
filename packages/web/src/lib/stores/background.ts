import { createPersistentStore } from './persistent';

export type BackgroundMode = 'none' | 'stars' | 'ripples';

const VALID_MODES: Set<string> = new Set(['none', 'stars', 'ripples']);

export const background = createPersistentStore<BackgroundMode>({
	key: 'background',
	defaultValue: 'stars',
	parse(stored): BackgroundMode {
		return stored && VALID_MODES.has(stored) ? (stored as BackgroundMode) : 'stars';
	},
});

export const setBackground = background.set;
export const initBackground = background.init;
