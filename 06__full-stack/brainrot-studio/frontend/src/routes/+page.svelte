<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/state/auth.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import LandingHero from '$lib/components/LandingHero.svelte';
	import FormatExplorer from '$lib/components/FormatExplorer.svelte';
	import FeatureShowcase from '$lib/components/FeatureShowcase.svelte';
	import LandingFooter from '$lib/components/LandingFooter.svelte';
	import Toast from '$lib/components/Toast.svelte';

	function handleGetStarted() {
		if (auth.accessToken) {
			goto('/app');
		} else {
			goto('/login');
		}
	}
</script>

<svelte:head>
	<title>Brainrot Studio - AI Viral Video Generator</title>
	<meta name="description" content="Turn wild ideas and documents into high-dopamine vertical videos for TikTok, YouTube Shorts, and Instagram Reels." />
</svelte:head>

<div class="relative min-h-screen bg-[#08090d] text-gray-100 selection:bg-emerald-500/30 overflow-x-hidden">
	<!-- Background Ambient Glow Orbs -->
	<div class="pointer-events-none absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[140px] animate-ambient-1"></div>
	<div class="pointer-events-none absolute top-1/2 right-1/4 h-[450px] w-[450px] rounded-full bg-cyan-600/10 blur-[140px] animate-ambient-2"></div>

	<!-- Navbar -->
	<Navbar onOpenCreateModal={handleGetStarted} />

	<!-- Hero Section -->
	<LandingHero onGetStarted={handleGetStarted} />

	<!-- Format Explorer Section -->
	<FormatExplorer />

	<!-- Feature Showcase Grid -->
	<FeatureShowcase onGetStarted={handleGetStarted} />

	<!-- Footer -->
	<LandingFooter />
</div>

<Toast />