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
				return 'bg-slate-900/60 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850/80 hover:border-slate-700 active:scale-[0.98]';
			case 'danger':
				return 'bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 hover:border-red-500/40 text-red-400 hover:text-red-300 active:scale-[0.98]';
			case 'ghost':
				return 'text-slate-400 hover:text-white hover:bg-slate-900/60 active:scale-[0.98]';
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
