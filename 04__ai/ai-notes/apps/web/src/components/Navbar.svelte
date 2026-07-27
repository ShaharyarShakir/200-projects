<script lang="ts">
	import { theme } from '../stores/theme.svelte.js';

	interface User {
		name: string;
		email: string;
		createdAt?: string | Date;
	}

	interface Props {
		user: User | null | undefined;
		loggingOut?: boolean;
		onlogout?: () => void;
	}

	let { user, loggingOut = false, onlogout }: Props = $props();
</script>

<nav
	class="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 dark:border-slate-900/80 dark:bg-slate-950/40 px-6 py-4 backdrop-blur-xl transition-colors duration-300"
>
	<div class="mx-auto flex max-w-6xl items-center justify-between">
		<!-- Logo -->
		<a href={user ? '/dashboard' : '/'} class="group flex items-center gap-2.5">
			<span
				class="bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 dark:from-violet-400 dark:via-indigo-400 dark:to-fuchsia-400 bg-clip-text text-xl font-bold tracking-tight text-transparent transition duration-300"
			>
				Notelify
			</span>
		</a>

		<!-- Auth / Theme / Nav Actions -->
		<div class="flex items-center gap-4 sm:gap-6">
			<!-- Theme Toggle Button -->
			<button
				onclick={() => theme.toggle()}
				class="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white transition duration-200"
				aria-label="Toggle theme"
			>
				{#if theme.current === 'dark'}
					<!-- Sun icon -->
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
					</svg>
				{:else}
					<!-- Moon icon -->
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{/if}
			</button>

			{#if user}
				<a
					href="/dashboard"
					class="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-200"
				>
					Dashboard
				</a>
				<div class="h-4 w-px bg-slate-200 dark:bg-slate-800/80"></div>
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-violet-500 to-indigo-500 p-[1px]"
					>
						<div
							class="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-slate-950 text-xs font-bold text-violet-600 dark:text-violet-300"
						>
							{user.name.charAt(0).toUpperCase()}
						</div>
					</div>
					<span class="hidden text-sm font-medium text-slate-600 dark:text-slate-300 sm:inline">
						{user.name}
					</span>
					<button
						onclick={onlogout}
						disabled={loggingOut}
						class="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800/80 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 dark:hover:text-white transition duration-200 disabled:opacity-50"
					>
						{#if loggingOut}
							Sign out...
						{:else}
							Logout
						{/if}
					</button>
				</div>
			{:else}
				<a
					href="/login"
					class="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-200"
				>
					Sign In
				</a>
				<a
					href="/register"
					class="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-950/20 transition-all duration-300 hover:border-violet-400/40 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
				>
					Register
				</a>
			{/if}
		</div>
	</div>
</nav>
