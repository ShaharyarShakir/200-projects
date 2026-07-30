<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Github, Bell } from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';
</script>

<div class="mx-auto max-w-2xl space-y-8 select-none">
	<!-- Page Heading -->
	<div class="flex flex-col gap-1.5">
		<h2
			class="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-tight"
		>
			Settings
		</h2>
		<p class="text-muted-foreground text-sm font-light">
			Manage your global developer settings, display preferences, and API integrations.
		</p>
	</div>

	<!-- settings blocks -->
	<div class="space-y-6">
		<!-- Theme preference block -->
		<Card.Root class="bg-card">
			<Card.Header>
				<Card.Title class="text-base font-bold">Preferences</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="border-border/40 flex items-center justify-between border-b py-1 pb-4">
					<div class="flex flex-col gap-0.5">
						<span class="text-foreground text-sm font-semibold">Theme Mode</span>
						<span class="text-muted-foreground text-xs font-light"
							>Toggle between dark and light appearance modes.</span
						>
					</div>
					<Button
						variant="outline"
						size="sm"
						onclick={toggleMode}
						class="rounded-lg font-semibold shadow-sm"
					>
						Change Theme
					</Button>
				</div>
				<div class="flex items-center justify-between py-1 pb-2">
					<div class="flex flex-col gap-0.5">
						<span class="text-foreground text-sm font-semibold">Desktop Notifications</span>
						<span class="text-muted-foreground text-xs font-light"
							>Receive real-time alerts for issue updates and pull approvals.</span
						>
					</div>
					<Button
						variant="ghost"
						size="icon"
						class="text-muted-foreground"
						aria-label="Notifications toggle"
					>
						<Bell class="h-5 w-5" />
					</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Integration credentials block -->
		<Card.Root class="bg-card">
			<Card.Header>
				<Card.Title class="text-base font-bold">Integrations</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between py-1 pb-2">
					<div class="flex flex-col gap-0.5">
						<div class="flex items-center gap-2">
							<Github class="text-foreground h-4 w-4" />
							<span class="text-foreground text-sm font-semibold">GitHub Integration</span>
						</div>
						<span class="text-muted-foreground text-xs font-light"
							>Your repository metrics and OAuth logins are linked to GitHub.</span
						>
					</div>
					<div
						class="flex items-center gap-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 text-xs font-semibold text-emerald-500"
					>
						<span>Connected</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Security credentials block -->
		<Card.Root class="bg-card border-red-500/20 bg-red-500/[0.01]">
			<Card.Header>
				<Card.Title class="text-base font-bold text-red-500">Danger Zone</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center justify-between py-1 pb-2">
					<div class="flex flex-col gap-0.5 pr-4">
						<span class="text-sm font-semibold text-red-500">Unlink GitHub Auth</span>
						<span class="text-muted-foreground text-xs font-light"
							>Disconnecting GitHub will revoke your current cookie login sessions.</span
						>
					</div>
					<Button variant="destructive" size="sm" class="rounded-lg font-semibold shadow-sm">
						Revoke Session
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
