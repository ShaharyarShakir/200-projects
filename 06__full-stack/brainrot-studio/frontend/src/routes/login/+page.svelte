<script lang="ts">
	import { goto } from '$app/navigation';
	import { login, getCurrentUser } from '$lib/api/auth';
	import { auth } from '$lib/state/auth.svelte';
	import { toast } from '$lib/state/toast.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit() {
		error = '';
		loading = true;

		try {
			const token = await login({
				email,
				password
			});

			auth.accessToken = token.access_token;
			const user = await getCurrentUser();

			auth.setSession(token.access_token, user);
			toast.show(`Welcome back, ${user.email}!`, 'success');
			await goto('/app');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed';
			toast.show(error, 'error');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Brainrot Studio</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center bg-[#08090d] p-6 text-gray-100 selection:bg-emerald-500/30 overflow-hidden">
	<!-- Background Ambient Orbs -->
	<div class="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-600/15 blur-[140px] animate-ambient-1"></div>
	<div class="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-600/15 blur-[140px] animate-ambient-2"></div>

	<div class="relative z-10 w-full max-w-md">
		<!-- Brand Banner -->
		<div class="text-center mb-8">
			<div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/30 mb-4 animate-fade-in text-black font-extrabold text-2xl">
				⚡
			</div>
			<h1 class="font-heading text-3xl font-extrabold tracking-tight gradient-emerald-cyan">
				Brainrot Studio
			</h1>
			<p class="text-xs text-gray-400 mt-1">Sign in to access your Studio Workspace</p>
		</div>

		<!-- Login Card -->
		<div class="bg-obsidian-card rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-2xl animate-fade-in">
			{#if error}
				<div class="alert alert-error mb-6 text-xs font-medium rounded-xl">
					<span>{error}</span>
				</div>
			{/if}

			<form
				class="space-y-5"
				onsubmit={(e) => {
					e.preventDefault();
					submit();
				}}
			>
				<div>
					<label for="login-email" class="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
						Email Address
					</label>
					<input
						id="login-email"
						type="email"
						bind:value={email}
						placeholder="name@example.com"
						class="input input-bordered w-full bg-white/5 border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder:text-gray-600 rounded-xl"
						required
					/>
				</div>

				<div>
					<label for="login-password" class="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
						Password
					</label>
					<input
						id="login-password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						class="input input-bordered w-full bg-white/5 border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder:text-gray-600 rounded-xl"
						required
					/>
				</div>

				<button
					type="submit"
					class="btn-emerald w-full py-3 text-sm font-semibold rounded-xl mt-2"
					disabled={loading}
				>
					{loading ? 'Authenticating...' : 'Sign In'}
				</button>
			</form>

			<div class="mt-6 text-center text-xs text-gray-400 border-t border-white/10 pt-4">
				Don't have an account?
				<a href="/register" class="font-semibold text-emerald-400 hover:text-emerald-300 ml-1">
					Create Account
				</a>
			</div>
		</div>
	</div>
</div>

<Toast />
