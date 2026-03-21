import { writable, type Writable } from 'svelte/store';

type PersistentStoreOptions<T extends string> = {
	key: string;
	defaultValue: T;
	parse: (stored: string | null) => T;
	onChange?: (value: T) => void;
};

type PersistentStore<T> = {
	subscribe: Writable<T>['subscribe'];
	set: (value: T) => void;
	init: () => void;
};

export function createPersistentStore<T extends string>({
	key,
	defaultValue,
	parse,
	onChange,
}: PersistentStoreOptions<T>): PersistentStore<T> {
	const store = writable<T>(defaultValue);

	function apply(value: T): void {
		store.set(value);
		onChange?.(value);
	}

	return {
		subscribe: store.subscribe,
		set(value: T): void {
			localStorage.setItem(key, value);
			apply(value);
		},
		init(): void {
			apply(parse(localStorage.getItem(key)));
		},
	};
}
