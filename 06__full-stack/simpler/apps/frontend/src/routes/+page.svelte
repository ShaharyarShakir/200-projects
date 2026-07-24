<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { auth } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Simpler | Minimalist Tasks & Notes Workspace</title>
	<meta
		name="description"
		content="Supercharge your productivity with Simpler. Keep track of checklists, write markdown notes, and organize your ideas in a beautiful dark mode workspace."
	/>
</svelte:head>

<!-- Landing Page Container -->
<div
	class="flex flex-col bg-slate-950 selection:bg-indigo-500 min-h-screen text-slate-100 selection:text-white"
>
	<Header />

	<main class="grow">
		<!-- Hero Section -->
		<section class="relative pt-20 lg:pt-32 pb-16 sm:pb-24 overflow-hidden">
			<!-- Background Glowing Accents -->
			<div
				class="top-0 left-1/4 -z-10 absolute bg-indigo-500/10 blur-[100px] rounded-full w-96 h-96 -translate-x-1/2"
			></div>
			<div
				class="top-1/3 right-1/4 -z-10 absolute bg-purple-600/10 blur-[120px] rounded-full w-[400px] h-100 translate-x-1/2"
			></div>

			<div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
				<!-- Announcement Badge -->
				<div
					class="inline-flex items-center gap-1.5 bg-indigo-500/10 px-3.5 py-1.5 border border-indigo-500/30 rounded-full font-semibold text-indigo-300 text-xs"
				>
					<span class="flex bg-indigo-400 rounded-full w-2 h-2 animate-pulse"></span>
					Introducing Simpler 1.0
				</div>

				<!-- Main Headline -->
				<h1
					class="mt-8 font-extrabold text-white text-4xl sm:text-6xl lg:text-7xl leading-tight tracking-tight"
				>
					Simplify Your Work. <br class="hidden sm:inline" />
					<span
						class="bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent"
					>
						Organize Your Life.
					</span>
				</h1>

				<!-- Subtext -->
				<p class="mx-auto mt-6 max-w-2xl text-slate-400 text-lg sm:text-xl leading-relaxed">
					A high-performance minimalist workspace designed to align your tasks and rich markdown
					notes in complete harmony. No clutter, no friction.
				</p>

				<!-- Hero CTAs -->
				<div class="flex flex-wrap justify-center gap-4 mt-10">
					{#if auth.isAuthenticated}
						<a
							href="/dashboard"
							class="bg-gradient-to-r from-indigo-600 hover:from-indigo-500 to-purple-600 hover:to-purple-500 shadow-indigo-600/20 shadow-xl hover:shadow-indigo-600/35 px-6 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-semibold text-white text-base active:scale-[0.98] transition-all"
						>
							Go to Dashboard
						</a>
					{:else}
						<a
							href="/register"
							class="bg-gradient-to-r from-indigo-600 hover:from-indigo-500 to-purple-600 hover:to-purple-500 shadow-indigo-600/20 shadow-xl hover:shadow-indigo-600/35 px-6 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-semibold text-white text-base active:scale-[0.98] transition-all"
						>
							Get Started for Free
						</a>
					{/if}
					<a
						href="#features"
						class="bg-slate-900/60 hover:bg-slate-800 backdrop-blur-sm px-6 py-3.5 border border-slate-800 hover:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700 font-semibold text-slate-300 hover:text-white text-base active:scale-[0.98] transition-all"
					>
						Explore Features
					</a>
				</div>

				<!-- Mockup Showcase -->
				<div class="relative mt-20 sm:mt-24">
					<div
						class="z-10 absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"
					></div>
					<div
						class="bg-slate-900/40 shadow-2xl shadow-indigo-500/5 backdrop-blur-sm p-4 border border-slate-800/80 rounded-2xl"
					>
						<!-- Mockup Window Header -->
						<div class="flex justify-between items-center mb-4 pb-3 border-slate-800 border-b">
							<div class="flex gap-2">
								<span class="bg-red-500/60 rounded-full w-3 h-3"></span>
								<span class="bg-yellow-500/60 rounded-full w-3 h-3"></span>
								<span class="bg-green-500/60 rounded-full w-3 h-3"></span>
							</div>
							<div class="bg-slate-950 px-8 py-1 rounded-md font-mono text-slate-500 text-xs">
								simpler.app/dashboard
							</div>
							<div class="w-12"></div>
						</div>
						<!-- Mockup Content Grid -->
						<div class="gap-4 grid grid-cols-1 md:grid-cols-3 p-2 text-left">
							<!-- Notes Sidebar Mock -->
							<div class="space-y-4 bg-slate-950/50 p-4 border border-slate-800/50 rounded-xl">
								<div class="flex justify-between items-center">
									<span class="font-bold text-slate-400 text-xs uppercase">Notes</span>
									<span class="text-indigo-400 text-xs">+ New</span>
								</div>
								<div class="space-y-2">
									<div class="bg-indigo-500/10 p-2.5 border border-indigo-500/20 rounded-lg">
										<h4 class="font-semibold text-indigo-300 text-xs">Project Launch Ideas</h4>
										<p class="mt-1 text-[10px] text-slate-400 line-clamp-1">
											Drafting steps for marketing release...
										</p>
									</div>
									<div class="bg-slate-900/60 p-2.5 border border-slate-800/50 rounded-lg">
										<h4 class="font-semibold text-slate-200 text-xs">Personal Journal Entry</h4>
										<p class="mt-1 text-[10px] text-slate-500 line-clamp-1">
											Reflecting on weekly milestones...
										</p>
									</div>
								</div>
							</div>
							<!-- Main Notes Editor Mock -->
							<div
								class="space-y-4 md:col-span-2 bg-slate-950/50 p-5 border border-slate-800/50 rounded-xl"
							>
								<div class="pb-3 border-slate-800/60 border-b">
									<span class="font-medium text-[10px] text-indigo-400">EDITING NOTE</span>
									<h3 class="mt-1 font-semibold text-white text-sm">🚀 Project Launch Ideas</h3>
								</div>
								<div class="space-y-3 font-mono text-slate-400 text-xs">
									<p class="text-indigo-400"># Next Steps</p>
									<p>- **Deploy to Production** - Ensure SSL and Postgres credentials are safe</p>
									<p>- **Announce on Discord & Twitter** - Write copy and create preview videos</p>
									<p>- **Gather Initial Feedback** - Send survey links to early adopters</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section id="features" class="bg-slate-950/40 py-20 sm:py-28 border-slate-900 border-t">
			<div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
				<div class="mx-auto max-w-3xl text-center">
					<h2 class="font-bold text-white text-3xl sm:text-4xl tracking-tight">
						Everything you need, nothing you don't.
					</h2>
					<p class="mt-4 text-slate-400 text-base">
						We stripped away the noise and complicated interfaces of modern tools to build a
						productive ecosystem that feels incredibly quick and natural.
					</p>
				</div>

				<div class="gap-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-16">
					<!-- Feature 1: Tasks -->
					<div
						class="bg-slate-900/30 p-8 border border-slate-850 hover:border-slate-800 rounded-2xl transition-colors"
					>
						<div
							class="flex justify-center items-center bg-indigo-500/10 rounded-xl w-12 h-12 text-indigo-400"
						>
							<svg
								class="w-6 h-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
						</div>
						<h3 class="mt-6 font-semibold text-white text-lg">Smart Task Checklist</h3>
						<p class="mt-3 text-slate-450 text-sm leading-relaxed">
							Write down action items, assign priorities, toggle task status instantly, and keep
							your workloads neatly organized.
						</p>
					</div>

					<!-- Feature 2: Notes -->
					<div
						class="bg-slate-900/30 p-8 border border-slate-850 hover:border-slate-800 rounded-2xl transition-colors"
					>
						<div
							class="flex justify-center items-center bg-purple-500/10 rounded-xl w-12 h-12 text-purple-400"
						>
							<svg
								class="w-6 h-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
								/>
							</svg>
						</div>
						<h3 class="mt-6 font-semibold text-white text-lg">Rich Markdown Editor</h3>
						<p class="mt-3 text-slate-450 text-sm leading-relaxed">
							Create notes featuring headers, bold markers, lists, code snippets, and favorite
							status. Perfect for documents or diaries.
						</p>
					</div>

					<!-- Feature 3: Performance -->
					<div
						class="sm:col-span-2 lg:col-span-1 bg-slate-900/30 p-8 border border-slate-850 hover:border-slate-800 rounded-2xl transition-colors"
					>
						<div
							class="flex justify-center items-center bg-pink-500/10 rounded-xl w-12 h-12 text-pink-400"
						>
							<svg
								class="w-6 h-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<h3 class="mt-6 font-semibold text-white text-lg">Vibrant & Blazing Fast</h3>
						<p class="mt-3 text-slate-450 text-sm leading-relaxed">
							Engineered with Svelte 5 and Vite for high responsiveness. Transitions are immediate,
							pages load in milliseconds.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Pricing Section -->
		<section id="pricing" class="py-20 sm:py-28 border-slate-900 border-t">
			<div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
				<div class="mx-auto max-w-3xl text-center">
					<h2 class="font-bold text-white text-3xl sm:text-4xl tracking-tight">
						Simple, transparent pricing.
					</h2>
					<p class="mt-4 text-slate-400 text-base">
						Start with our feature-rich free plan, and upgrade whenever you need unlimited scale.
					</p>
				</div>

				<div
					class="flex md:flex-row flex-col justify-center items-stretch gap-8 mx-auto mt-16 max-w-4xl"
				>
					<!-- Pricing Plan 1 -->
					<div
						class="flex flex-col flex-1 justify-between bg-slate-900/20 p-8 border border-slate-800 rounded-2xl"
					>
						<div>
							<h3 class="font-semibold text-white text-lg">Starter</h3>
							<p class="mt-2 text-slate-400 text-sm">Essential note and task tracking tools.</p>
							<p class="mt-6">
								<span class="font-extrabold text-white text-4xl">$0</span>
								<span class="font-medium text-slate-400 text-sm">/ month</span>
							</p>
							<ul class="space-y-4 mt-8 text-slate-400 text-sm">
								<li class="flex items-center gap-3">
									<svg
										class="w-5 h-5 text-indigo-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Create up to 50 active tasks
								</li>
								<li class="flex items-center gap-3">
									<svg
										class="w-5 h-5 text-indigo-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Unlimited note drafts
								</li>
								<li class="flex items-center gap-3">
									<svg
										class="w-5 h-5 text-indigo-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Basic search and tag categorization
								</li>
							</ul>
						</div>
						<div class="mt-8">
							<a
								href="/register"
								class="block bg-slate-900 hover:bg-slate-800 py-3 border border-slate-800 rounded-xl w-full font-semibold text-slate-200 hover:text-white text-sm text-center transition-all"
							>
								Get Started Free
							</a>
						</div>
					</div>

					<!-- Pricing Plan 2 (Pro) -->
					<div
						class="relative flex flex-col flex-1 justify-between bg-slate-900/40 shadow-indigo-500/5 shadow-xl p-8 border-2 border-indigo-500 rounded-2xl"
					>
						<div
							class="-top-4 left-1/2 absolute bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1 rounded-full font-semibold text-white text-xs uppercase tracking-wide -translate-x-1/2"
						>
							Most Popular
						</div>
						<div>
							<h3 class="font-semibold text-white text-lg">Pro Workspace</h3>
							<p class="mt-2 font-medium text-slate-400 text-sm">
								Uncapped scale for power creators.
							</p>
							<p class="mt-6">
								<span class="font-extrabold text-white text-4xl">$4</span>
								<span class="font-medium text-slate-450 text-sm">/ month</span>
							</p>
							<ul class="space-y-4 mt-8 text-slate-350 text-sm">
								<li class="flex items-center gap-3">
									<svg
										class="w-5 h-5 text-indigo-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Unlimited active and archived tasks
								</li>
								<li class="flex items-center gap-3">
									<svg
										class="w-5 h-5 text-indigo-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Unlimited notes + markdown rendering
								</li>
								<li class="flex items-center gap-3">
									<svg
										class="w-5 h-5 text-indigo-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Convert notes to tasks in 1 click
								</li>
								<li class="flex items-center gap-3">
									<svg
										class="w-5 h-5 text-indigo-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Priority help & early access features
								</li>
							</ul>
						</div>
						<div class="mt-8">
							<a
								href="/register"
								class="block bg-gradient-to-r from-indigo-600 hover:from-indigo-500 to-purple-600 hover:to-purple-500 shadow-indigo-600/20 shadow-lg hover:shadow-indigo-600/30 py-3 rounded-xl w-full font-semibold text-white text-sm text-center transition-all"
							>
								Upgrade to Pro
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>
	</main>

	<Footer />
</div>
