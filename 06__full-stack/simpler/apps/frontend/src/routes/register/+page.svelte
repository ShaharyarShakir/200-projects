<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters long';
			return;
		}

		loading = true;

		try {
			await auth.register(email, password);
			goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'Failed to create account';
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/60 p-8 shadow-2xl backdrop-blur-md"
>
	<div class="mb-8 text-center">
		<h1 class="text-3xl font-bold tracking-tight text-white">Create an account</h1>
		<p class="mt-2 text-sm text-slate-400">Get started with TaskNotes today</p>
	</div>

	{#if error}
		<div
			class="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
		>
			<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<span>{error}</span>
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<div>
			<label for="email" class="mb-1.5 block text-sm font-medium text-slate-300"
				>Email address</label
			>
			<input
				id="email"
				type="email"
				bind:value={email}
				required
				placeholder="you@example.com"
				class="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
			/>
		</div>

		<div>
			<label for="password" class="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				required
				placeholder="At least 8 characters"
				class="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
			/>
		</div>

		<div>
			<label for="confirmPassword" class="mb-1.5 block text-sm font-medium text-slate-300"
				>Confirm Password</label
			>
			<input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				required
				placeholder="••••••••"
				class="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{loading ? 'Creating account...' : 'Register'}
		</button>
	</form>

	<p class="mt-8 text-center text-sm text-slate-400">
		Already have an account?
		<a
			href="/login"
			class="font-medium text-indigo-400 underline underline-offset-4 transition-colors hover:text-indigo-300"
			>Sign In</a
		>
	</p>
</div>
