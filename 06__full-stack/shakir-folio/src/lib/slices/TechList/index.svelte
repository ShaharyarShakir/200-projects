<script lang="ts">
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import IconCircle from '~icons/ic/baseline-circle';
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
	gsap.registerPlugin(ScrollTrigger);
	type Props = SliceComponentProps<Content.TechListSlice>;
	const { slice }: Props = $props();
	let component: HTMLElement;
	onMount(() => {
		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: component,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 4
				// markers: true
			}
		});
		tl.fromTo(
			'.tech-row',
			{
				x: (index) => {
					return index % 2 === 0 ? gsap.utils.random(600, 400) : gsap.utils.random(-600, -400);
				}
			},
			{
				x: (index) => {
					return index % 2 === 0 ? gsap.utils.random(-600, -400) : gsap.utils.random(600, 400);
				},
				ease: 'power1.inOut'
			}
		);
	});
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="overflow-hidden"
	bind:this={component}
>
	<Bounded as="div">
		<Heading size="xl" tag="h2" class="mb-8">
			{slice.primary.heading}
		</Heading>
	</Bounded>
	{#each slice.primary.items as { tech_color, tech_name }}
		<div
			class="tech-row mb-8 flex items-center justify-center gap-4 text-slate-700"
			aria-label={tech_name || undefined}
		>
			{#each Array(15) as _, index}
				<span
					class="tecth-item text-8xl font-extrabold uppercase tracking-tighter"
					style="color: {index === 7 && tech_color ? tech_color : 'inherit'};"
				>
					{tech_name}
				</span>
				<span class="text3xl">
					<IconCircle />
				</span>
			{/each}
		</div>
	{/each}
</section>
