<script lang="ts">
	import { Zap } from 'lucide-svelte';
	import { auth } from '$lib/state/auth.svelte';
</script>

<a href={auth.user ? '/app' : '/'} class="group flex items-center gap-3">
	<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-105">
		<Zap class="h-5 w-5 fill-black stroke-black" />
	</div>
	<span class="font-heading text-xl font-black tracking-tight text-white flex items-center gap-1">
		Brainrot Shorts
	</span>
</a>
