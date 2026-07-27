<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		type = 'button',
		variant = 'primary',
		disabled = false,
		loading = false,
		class: customClass = '',
		onclick,
		children,
		...restProps
	}: Props = $props();

	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'primary':
				return 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-950/20 border border-violet-500/30 hover:border-violet-400/50 hover:shadow-violet-500/20 active:scale-[0.98]';
			case 'secondary':
				return 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-900/60 dark:backdrop-blur-md dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 active:scale-[0.98]';
			case 'danger':
				return 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:border-red-900/30 dark:text-red-400 dark:hover:text-red-300 active:scale-[0.98]';
			case 'ghost':
				return 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60 active:scale-[0.98]';
			default:
				return '';
		}
	});
</script>

<button
	{type}
	disabled={disabled || loading}
	{onclick}
	class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 {variantClasses} {customClass}"
	{...restProps}
>
	{#if loading}
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current"
		></span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</button>
