import { writable } from 'svelte/store';

export interface ToastMessage {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
	duration?: number;
}

/**
 * Custom Svelte store to manage notification toasts.
 */
function createToastStore() {
	const { subscribe, update } = writable<ToastMessage[]>([]);

	return {
		subscribe,
		// Add a new toast and set a timer to remove it
		add(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) {
			const id = Math.random().toString(36).substring(2, 9);
			update((list) => [...list, { id, message, type, duration }]);

			setTimeout(() => {
				update((list) => list.filter((item) => item.id !== id));
			}, duration);
		},
		// Manually close/remove a toast
		remove(id: string) {
			update((list) => list.filter((item) => item.id !== id));
		}
	};
}

export const toasts = createToastStore();
