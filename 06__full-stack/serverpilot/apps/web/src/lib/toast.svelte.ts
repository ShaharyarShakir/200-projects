export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
	duration: number;
}

class ToastStore {
	#toasts = $state<Toast[]>([]);

	get toasts() {
		return this.#toasts;
	}

	show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) {
		const id = Math.random().toString(36).substring(2, 9);
		const newToast: Toast = { id, message, type, duration };

		this.#toasts = [...this.#toasts, newToast];

		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}
	}

	success(message: string, duration = 4000) {
		this.show(message, 'success', duration);
	}

	error(message: string, duration = 4000) {
		this.show(message, 'error', duration);
	}

	dismiss(id: string) {
		this.#toasts = this.#toasts.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();
