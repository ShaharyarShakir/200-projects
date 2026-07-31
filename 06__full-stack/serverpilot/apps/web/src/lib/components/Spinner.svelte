<script lang="ts">
	let { size = 'md', color = 'indigo' } = $props<{
		size?: 'sm' | 'md' | 'lg';
		color?: 'indigo' | 'white' | 'zinc';
	}>();

	const sizeClasses = {
		sm: 'h-4 w-4 border-2',
		md: 'h-6 w-6 border-2',
		lg: 'h-8 w-8 border-3'
	};

	const colorClasses = {
		indigo: 'border-indigo-500 border-t-transparent',
		white: 'border-white border-t-transparent',
		zinc: 'border-zinc-400 border-t-transparent'
	};
</script>

<div class="animate-spin rounded-full {sizeClasses[size]} {colorClasses[color]}" role="status">
	<span class="sr-only">Loading...</span>
</div>
