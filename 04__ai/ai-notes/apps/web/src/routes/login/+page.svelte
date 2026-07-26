<script lang="ts">
	import { authClient } from "$lib/auth/client.js";
	import { goto } from "$app/navigation";

	let email = $state("");
	let password = $state("");
	let loading = $state(false);
	let error = $state("");

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email || !password) {
			error = "Please fill in all fields.";
			return;
		}
		error = "";
		loading = true;

		try {
			const { data, error: authError } = await authClient.signIn.email({
				email,
				password,
				callbackURL: "/dashboard"
			});

			if (authError) {
				error = authError.message || "Failed to sign in. Please check your credentials.";
			} else {
				// Redirect to dashboard
				await goto("/dashboard");
			}
		} catch (err: any) {
			error = err.message || "An unexpected error occurred.";
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In | AI Notes</title>
	<meta name="description" content="Sign in to your AI Notes account." />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-radial from-slate-900 to-black px-4 relative overflow-hidden">
	<!-- Background abstract glow -->
	<div class="absolute w-96 h-96 rounded-full bg-violet-600/10 blur-3xl -top-12 -left-12"></div>
	<div class="absolute w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl -bottom-12 -right-12"></div>

	<div class="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
				Welcome Back
			</h1>
			<p class="text-slate-400 mt-2 text-sm">Sign in to access your intelligent space</p>
		</div>

		{#if error}
			<div class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3.5 mb-6 text-center">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-5">
			<div>
				<label for="email" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					placeholder="you@example.com"
					class="w-full bg-slate-950/40 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white rounded-lg px-4 py-3 text-sm transition duration-200 outline-none placeholder:text-slate-600"
				/>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
				</div>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					placeholder="••••••••"
					class="w-full bg-slate-950/40 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white rounded-lg px-4 py-3 text-sm transition duration-200 outline-none placeholder:text-slate-600"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-lg px-4 py-3 text-sm shadow-lg shadow-violet-950/20 active:scale-[0.98] transition duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2 cursor-pointer"
			>
				{#if loading}
					<span class="border-2 border-white/20 border-t-white rounded-full w-4 h-4 animate-spin"></span>
					Signing In...
				{:else}
					Sign In
				{/if}
			</button>
		</form>

		<div class="mt-8 text-center text-sm text-slate-500">
			Don't have an account yet?
			<a href="/register" class="text-violet-400 hover:text-violet-300 font-medium transition duration-200 underline decoration-violet-500/30 underline-offset-4">Create One</a>
		</div>
	</div>
</div>
