<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { authStore } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Card from '$lib/components/Card.svelte';
	import { KeyRound, Mail } from 'lucide-svelte';

	// Validation Schema
	const loginSchema = z.object({
		email: z.string().email('Please enter a valid email address'),
		password: z.string().min(6, 'Password must be at least 6 characters')
	});

	let loading = $state(false);

	// Setup Superform in SPA mode
	const { form, errors, enhance } = superForm(defaults(zod4(loginSchema)), {
		SPA: true,
		validators: zod4(loginSchema),
		async onUpdate({ form }) {
			if (!form.valid) return;

			loading = true;
			try {
				await authStore.login(form.data.email, form.data.password);
				toast.success('Welcome back to ServerPilot!');
				goto('/dashboard');
			} catch (err: any) {
				toast.error(err.message || 'Login failed. Please check your credentials.');
			} finally {
				loading = false;
			}
		}
	});
</script>

<svelte:head>
	<title>Login | ServerPilot</title>
	<meta
		name="description"
		content="Sign in to your ServerPilot dashboard to manage your infrastructure."
	/>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-4">
	<!-- Background glow blobs -->
	<div
		class="pointer-events-none absolute -top-[30%] -left-[20%] h-[70vw] w-[70vw] rounded-full bg-indigo-500/10 blur-[120px]"
	></div>
	<div
		class="pointer-events-none absolute -right-[20%] -bottom-[30%] h-[70vw] w-[70vw] rounded-full bg-cyan-500/10 blur-[120px]"
	></div>

	<div class="relative z-10 w-full max-w-md">
		<!-- Header Logo/Title -->
		<div class="mb-8 flex flex-col items-center">
			<div
				class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20"
			>
				<span class="font-display text-xl font-black tracking-wider text-white">SP</span>
			</div>
			<h2 class="font-display text-3xl font-extrabold tracking-tight text-zinc-100">ServerPilot</h2>
			<p class="text-zinc-450 mt-2 text-sm">Manage and monitor your nodes in real-time</p>
		</div>

		<Card
			title="Welcome Back"
			description="Sign in with your email to access your server dashboard."
		>
			<form use:enhance method="POST" class="flex flex-col gap-5">
				<!-- Email Field -->
				<div class="relative">
					<Input
						label="Email Address"
						name="email"
						type="email"
						placeholder="name@example.com"
						bind:value={$form.email}
						error={$errors.email?.[0]}
						required
					/>
					<Mail class="absolute top-[38px] right-3.5 h-4 w-4 text-zinc-500" />
				</div>

				<!-- Password Field -->
				<div class="relative">
					<Input
						label="Password"
						name="password"
						type="password"
						placeholder="••••••••"
						bind:value={$form.password}
						error={$errors.password?.[0]}
						required
					/>
					<KeyRound class="absolute top-[38px] right-3.5 h-4 w-4 text-zinc-500" />
				</div>

				<!-- Action trigger button -->
				<Button type="submit" class="mt-2 w-full" {loading}>Sign In</Button>

				<!-- Switch trigger -->
				<div class="mt-2 text-center text-xs text-zinc-400">
					Don't have an account?
					<a
						href="/register"
						class="ml-1 font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
						>Create an account</a
					>
				</div>
			</form>
		</Card>
	</div>
</div>
