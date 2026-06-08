<script lang="ts">
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import type { Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';

	type Props = SliceComponentProps<Content.ExperienceSlice>;

	const { slice }: Props = $props();
</script>

<Bounded data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<Heading size="lg" tag="h2">
		{slice.primary.heading}
	</Heading>
	{#each slice.primary.items as { title, time_period, institution, description }}
		<div class="ml-6 mt-8 max-w-prose md:ml-12 md:mt-16">
			<Heading size="sm" tag="h3">
				{title}
			</Heading>
			<p
				class="mt-1 flex w-fit items-center gap-1 text-2xl font-semibold tracking-light text-slate-400"
			>
				<span>{time_period}</span>{' '}
				<span class="text-3xl font-extralight">/</span>{' '}
				<span>{institution}</span>
			</p>
			<div class="prose prose-lg prose-invert mt-4">
				<PrismicRichText field={description} />
			</div>
		</div>
	{/each}
</Bounded>
