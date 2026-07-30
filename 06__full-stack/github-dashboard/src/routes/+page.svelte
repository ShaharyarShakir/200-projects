<script lang="ts">
	import { Github, ArrowRight, FolderGit2, Bug, GitPullRequest, ChartColumn } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<div
	class="bg-background text-foreground relative flex min-h-screen flex-col justify-between overflow-hidden font-sans select-none"
>
	<!-- Background Ambient Blurs -->
	<div
		class="pointer-events-none absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px]"
	></div>
	<div
		class="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[150px]"
	></div>

	<!-- Header / Navbar -->
	<header class="z-10 mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
		<div class="flex items-center gap-2">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg"
			>
				<Github class="h-4 w-4" />
			</div>
			<span
				class="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-lg font-bold tracking-tight text-transparent"
				>GitDash</span
			>
		</div>
		<div>
			<Button
				href="/login"
				variant="ghost"
				class="text-muted-foreground hover:text-foreground transition"
			>
				Sign In
			</Button>
		</div>
	</header>

	<!-- Hero Section -->
	<main
		class="z-10 mx-auto my-12 flex max-w-4xl flex-1 flex-col items-center justify-center px-6 text-center"
	>
		<div
			class="mb-6 inline-flex animate-pulse items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-400"
		>
			<span>Introducing GitDash</span>
			<ArrowRight class="h-3.5 w-3.5" />
		</div>

		<h1
			class="from-foreground to-foreground/80 mb-6 bg-gradient-to-b bg-clip-text text-5xl leading-none font-extrabold tracking-tight text-transparent md:text-7xl"
		>
			GitDash
		</h1>

		<p
			class="text-muted-foreground mx-auto mb-10 max-w-2xl text-lg leading-relaxed font-light md:text-xl"
		>
			Manage and analyze all your GitHub repositories in one place. Get insights, track issues,
			review pulls, and optimize your developer workflow.
		</p>

		<div class="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
			<Button
				href="/login"
				size="lg"
				class="h-12 w-full gap-2.5 rounded-xl bg-blue-600 px-8 font-medium text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/20 sm:w-auto"
			>
				<Github class="h-5 w-5" />
				<span>Sign in with GitHub</span>
			</Button>
			<Button
				href="#features"
				variant="outline"
				size="lg"
				class="border-border hover:bg-accent text-foreground h-12 w-full rounded-xl px-8 transition duration-200 sm:w-auto"
			>
				Learn More
			</Button>
		</div>

		<!-- Mini Mockup Showcase -->
		<div id="features" class="mt-24 grid w-full grid-cols-2 gap-4 md:grid-cols-4">
			<div
				class="border-border bg-card/30 hover:border-border/80 rounded-2xl border p-5 text-left backdrop-blur-sm transition duration-300"
			>
				<div class="mb-3 w-fit rounded-lg bg-blue-500/10 p-2 text-blue-400">
					<FolderGit2 class="h-5 w-5" />
				</div>
				<h3 class="mb-1 text-sm font-semibold">Repositories</h3>
				<p class="text-muted-foreground text-xs">Track languages, forks, stars & commits.</p>
			</div>
			<div
				class="border-border bg-card/30 hover:border-border/80 rounded-2xl border p-5 text-left backdrop-blur-sm transition duration-300"
			>
				<div class="mb-3 w-fit rounded-lg bg-purple-500/10 p-2 text-purple-400">
					<Bug class="h-5 w-5" />
				</div>
				<h3 class="mb-1 text-sm font-semibold">Issues</h3>
				<p class="text-muted-foreground text-xs">Filter, prioritize, and close bugs fast.</p>
			</div>
			<div
				class="border-border bg-card/30 hover:border-border/80 rounded-2xl border p-5 text-left backdrop-blur-sm transition duration-300"
			>
				<div class="mb-3 w-fit rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
					<GitPullRequest class="h-5 w-5" />
				</div>
				<h3 class="mb-1 text-sm font-semibold">Pulls</h3>
				<p class="text-muted-foreground text-xs">Monitor code changes & review status.</p>
			</div>
			<div
				class="border-border bg-card/30 hover:border-border/80 rounded-2xl border p-5 text-left backdrop-blur-sm transition duration-300"
			>
				<div class="mb-3 w-fit rounded-lg bg-amber-500/10 p-2 text-amber-400">
					<ChartColumn class="h-5 w-5" />
				</div>
				<h3 class="mb-1 text-sm font-semibold">Analytics</h3>
				<p class="text-muted-foreground text-xs">Analyze developer velocity and stats.</p>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer
		class="text-muted-foreground/60 border-border/50 z-10 mx-auto flex h-16 w-full max-w-7xl items-center justify-between border-t px-6 text-xs"
	>
		<span>&copy; {new Date().getFullYear()} GitDash. All rights reserved.</span>
		<div class="flex gap-4">
			<a
				href="https://github.com"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-foreground transition">GitHub</a
			>
			<a href="/login" class="hover:text-foreground transition">Login</a>
		</div>
	</footer>
</div>
