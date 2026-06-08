<script lang="ts">
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';
	import ContentList from './ContentList.svelte';

	type Props = SliceComponentProps<Content.ContentIndexSlice> & {
		items: Content.BlogpostDocument[] | Content.ProjectDocument[];
	};

	const { slice, items }: Props = $props();
</script>

<Bounded data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<Heading tag="h1" size="xl" class="mb-8">
		{slice.primary.heading}
	</Heading>
	{#if isFilled.richText(slice.primary.description)}
		<div class="prose prose-xl prose-invert mb-10">
			<PrismicRichText field={slice.primary.description} />
		</div>
	{/if}
	<ContentList
		{items}
		fallBackItemImage={slice.primary.fallback_item_image}
		readViewMore={slice.primary.read_view_more}
	/>
</Bounded>
