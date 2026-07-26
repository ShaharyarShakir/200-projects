<script lang="ts">
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
	class="sticky top-0 z-50 border-b border-slate-900/80 bg-slate-950/40 px-6 py-4 backdrop-blur-xl"
>
	<div class="mx-auto flex max-w-6xl items-center justify-between">
		<!-- Logo -->
		<a href={user ? '/dashboard' : '/'} class="group flex items-center gap-2.5">
			<span
				class="bg-linear-to-r from-violet-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-xl font-bold tracking-tight text-transparent text-white transition duration-300 group-hover:from-violet-300 group-hover:via-indigo-300 group-hover:to-fuchsia-300"
			>
				AI Notes
			</span>
		</a>

		<!-- Auth Actions / Nav Links -->
		<div class="flex items-center gap-6">
			{#if user}
				<a
					href="/dashboard"
					class="text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-white"
				>
					Dashboard
				</a>
				<div class="h-4 w-px bg-slate-800/80"></div>
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-violet-500 to-indigo-500 p-[1px]"
					>
						<div
							class="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-violet-300"
						>
							{user.name.charAt(0).toUpperCase()}
						</div>
					</div>
					<span class="hidden text-sm font-medium text-slate-300 sm:inline">
						{user.name}
					</span>
					<button
						onclick={onlogout}
						disabled={loggingOut}
						class="cursor-pointer rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-400 transition duration-200 hover:bg-slate-900 hover:text-white disabled:opacity-50"
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
					class="text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-white"
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
