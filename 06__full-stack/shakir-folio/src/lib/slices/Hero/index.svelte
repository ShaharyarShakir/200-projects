<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import Scene from './3d-components/Scene.svelte';
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	type Props = SliceComponentProps<Content.HeroSlice>;
	const { slice }: Props = $props();

	let first_name_letters = slice.primary.first_name?.split('') ?? '';
	let last_name_letters = slice.primary.last_name?.split('') ?? '';

	onMount(() => {
		const tl = gsap.timeline();
		tl.fromTo(
			'.name-animate',
			{ x: -100, opacity: 0, rotate: -10 },
			{
				x: 0,
				opacity: 1,
				rotate: 0,
				ease: 'elastic.out(1,0.3)',
				duration: 1,
				transformOrigin: 'left top',
				delay: 0.5,
				stagger: { each: 0.1, from: 'random' }
			}
		);
		tl.fromTo(
			'.job-title',
			{ y: 20, opacity: 0, scale: 1.5 },
			{
				opacity: 1,
				y: 0,
				duration: 1,
				scale: 1,
				ease: 'elastic.out(1,0.3)'
			}
		);
	});
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="px-4 md:px-6 relative"
>
	<div class="mx-auto w-full max-w-7xl">
		<div class="grid min-h-[70vh] grid-cols-1 items-center md:grid-cols-2">
			<div
				class="relative z-10 row-span-1 row-start-1 aspect-[1/1.3] overflow-hidden md:col-span-1 md:col-start-2"
			>
				<Scene />
			</div>

			<div class="col-start-1 md:row-start-1 relative z-20">
				<h1
					class="mb-2 md:mb-3 text-[clamp(3rem,15vmin,13rem)]
          font-extrabold leading-none tracking-tighter text-nowrap"
					aria-label={slice.primary.first_name + '' + slice.primary.last_name}
				>
					{#if first_name_letters.length && last_name_letters.length}
						<span class="block text-slate-300">
							{#each first_name_letters as letter}
								<span class="name-animate inline-block opacity-0">{letter}</span>
							{/each}
						</span>
						<span class="block text-slate-500 -mt-[.1em]">
							{#each last_name_letters as letter}
								<span class="name-animate inline-block opacity-0">{letter}</span>
							{/each}
						</span>
					{/if}
				</h1>
				<span
					class="job-title block bg-gradient-to-tr from-amber-500 via-amber-200 to-amber-900 bg-clip-text text-transparent text-2xl font-bold tracking-[.2em] uppercase md:text-4xl opacity-0"
				>
					{slice.primary.tag_line}
				</span>
			</div>
		</div>
	</div>
</section>
