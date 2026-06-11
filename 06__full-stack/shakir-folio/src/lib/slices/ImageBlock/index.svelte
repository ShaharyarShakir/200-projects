<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicImage, type SliceComponentProps } from '@prismicio/svelte';

	type Props = SliceComponentProps<Content.ImageBlockSlice>;

	const { slice }: Props = $props();
</script>

<PrismicImage
	field={slice.primary.image}
	class="not-prose w-full h-full rounded-md my-10 md:my-14 lg:my-16"
/>
