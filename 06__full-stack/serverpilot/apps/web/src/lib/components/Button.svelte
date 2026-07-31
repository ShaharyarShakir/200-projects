<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from './Spinner.svelte';

	let {
		children,
		variant = 'default',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		onclick,
		class: className = '',
		...rest
	} = $props<{
		children: Snippet;
		variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		[key: string]: any;
	}>();

	const variantClasses = {
		default:
			'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/10 focus-visible:ring-indigo-500 active:scale-[0.98]',
		secondary:
			'bg-zinc-800 text-zinc-150 hover:bg-zinc-700 border border-zinc-700/60 focus-visible:ring-zinc-700 active:scale-[0.98]',
		outline:
			'bg-transparent text-zinc-300 border border-zinc-700 hover:bg-zinc-900/50 hover:text-zinc-100 focus-visible:ring-zinc-700 active:scale-[0.98]',
		ghost:
			'bg-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 focus-visible:ring-zinc-800',
		destructive:
			'bg-red-950/40 text-red-200 border border-red-900/50 hover:bg-red-900/40 hover:text-red-100 focus-visible:ring-red-700 active:scale-[0.98]'
	};

	const sizeClasses = {
		sm: 'h-9 px-3 text-xs rounded-md',
		md: 'h-10 px-4 py-2 text-sm rounded-lg',
		lg: 'h-11 px-8 text-base rounded-xl'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	{onclick}
	class="inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition-all select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 {variantClasses[
		variant
	]} {sizeClasses[size]} {className}"
	{...rest}
>
	{#if loading}
		<Spinner size="sm" color={variant === 'default' ? 'white' : 'indigo'} />
	{/if}
	{@render children()}
</button>
