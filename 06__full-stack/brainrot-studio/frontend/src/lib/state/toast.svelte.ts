export interface ToastMessage {
	id: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error';
}

class ToastState {
	toasts = $state<ToastMessage[]>([]);

	show(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000) {
		const id = Math.random().toString(36).substring(2, 9);
		this.toasts.push({ id, message, type });

		setTimeout(() => {
			this.remove(id);
		}, duration);
	}

	remove(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toast = new ToastState();
