<script lang="ts">
	import { authClient } from '$lib/auth/client.js';
	import { goto, invalidateAll } from '$app/navigation';
	import GlowBg from '../../components/GlowBg.svelte';
	import Button from '../../components/Button.svelte';
	import Input from '../../components/Input.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name || !email || !password) {
			error = 'Please fill in all fields.';
			return;
		}
		error = '';
		loading = true;

		try {
			const { data, error: authError } = await authClient.signUp.email({
				email,
				password,
				name,
				callbackURL: '/dashboard'
			});

			if (authError) {
				error = authError.message || 'Failed to register. Please try again.';
			} else {
				// Redirect to dashboard
				await goto('/dashboard');
				await invalidateAll();
			}
		} catch (err: any) {
			error = err.message || 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Register | AI Notes</title>
	<meta
		name="description"
		content="Create your AI Notes account and start organizing with intelligence."
	/>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">
	<!-- Background Orbs (only in dark mode) -->
	<div class="hidden dark:block">
		<GlowBg />
	</div>

	<div
		class="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors duration-350"
	>
		<div class="mb-8 text-center">
			<h1
				class="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white"
			>
				Create Account
			</h1>
			<p class="mt-2 text-sm font-light text-slate-500 dark:text-slate-400">
				Join AI Notes and experience intelligent productivity
			</p>
		</div>

		{#if error}
			<div
				class="mb-6 animate-pulse rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-650 dark:text-red-400"
			>
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-5">
			<Input
				type="text"
				id="name"
				bind:value={name}
				required={true}
				label="Name"
				placeholder="John Doe"
			/>

			<Input
				type="email"
				id="email"
				bind:value={email}
				required={true}
				label="Email Address"
				placeholder="you@example.com"
			/>

			<Input
				type="password"
				id="password"
				bind:value={password}
				required={true}
				label="Password"
				placeholder="••••••••"
			/>

			<div class="pt-2">
				<Button type="submit" disabled={loading} {loading} class="w-full py-3">
					Create Account
				</Button>
			</div>
		</form>

		<div class="text-slate-500 dark:text-slate-450 mt-8 text-center text-sm">
			Already have an account?
			<a
				href="/login"
				class="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
			>
				Sign In
			</a>
		</div>
	</div>
</div>
