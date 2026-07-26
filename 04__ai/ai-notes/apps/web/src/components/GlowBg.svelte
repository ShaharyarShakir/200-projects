<script lang="ts">
	// GlowBg component - renders floating blurred orbs for high-end sci-fi/glassmorphic background depth.
</script>

<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
	<!-- Ambient Orb 1: Violet/Fuchsia -->
	<div
		class="absolute top-[-10%] left-[-10%] h-150 w-150 animate-float-slow rounded-full bg-linear-to-tr from-violet-600/10 to-fuchsia-600/10 blur-[140px]"
	></div>

	<!-- Ambient Orb 2: Indigo/Cyan -->
	<div
		class="absolute right-[-10%] bottom-[-10%] h-175 w-175 animate-pulse-slow rounded-full bg-linear-to-br from-indigo-600/10 to-cyan-600/5 blur-[160px]"
	></div>

	<!-- Extra Accent Center-right Orb -->
	<div
		class="absolute top-[30%] right-[10%] h-87.5 w-87.5 animate-pulse-slow rounded-full bg-purple-500/5 blur-[120px]"
	></div>
</div>
