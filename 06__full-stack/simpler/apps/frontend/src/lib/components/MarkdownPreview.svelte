<script lang="ts">
	import { marked } from 'marked';

	let { content = '' } = $props<{ content: string }>();

	let html = $derived(marked.parse(content || '*No content*'));
</script>

<div class="dark:prose-invert prose max-w-none overflow-y-auto p-4">
	{@html html}
</div>
