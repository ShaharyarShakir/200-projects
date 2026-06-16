<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { resolve } from '$app/paths';

	let error = $state('');
	async function signup(e: Event) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const username = form.username.value;
		const email = form.email.value;
		const password = form.password.value;
		const confirmPassword = form.confirmPassword.value;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		if (!username || !email || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}
		await authClient.signUp.email(
			{
				name: username,
				email,
				password
			},
			{
				onSuccess: async () => {
					goto(resolve('/'));
				}
			}
		);
	}
</script>

<div class="box-1">
	<h1>Sign up</h1>
	<form onsubmit={signup}>
		<div class="row">
			<label>
				Username:
				<input type="text" id="username" />
			</label>
		</div>
		<div class="row">
			<label>
				Email:
				<input type="email" id="email" /></label
			>
		</div>
		<div class="row">
			<label>
				Password:
				<input type="password" id="password" /></label
			>
		</div>
		<div class="row">
			<label>
				Confirm Password:
				<input type="password" id="confirmPassword" /></label
			>
		</div>
		{#if error}
			<p style:color="var(--red)">{error}</p>
		{/if}
		<button type="submit">Sign Up</button>
	</form>
</div>
