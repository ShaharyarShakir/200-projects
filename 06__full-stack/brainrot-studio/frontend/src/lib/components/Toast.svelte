<script lang="ts">
	import { toast } from '$lib/state/toast.svelte';
</script>

{#if toast.toasts.length > 0}
	<div class="toast toast-end toast-bottom z-50">
		{#each toast.toasts as item (item.id)}
			<div
				class="alert animate-fade-in shadow-xl flex items-center justify-between transition-all duration-300 {
					item.type === 'error'
						? 'alert-error'
						: item.type === 'success'
						? 'alert-success'
						: item.type === 'warning'
						? 'alert-warning'
						: 'alert-info'
				}"
			>
				<span class="text-sm font-medium">{item.message}</span>
				<button
					class="btn btn-xs btn-circle btn-ghost"
					onclick={() => toast.remove(item.id)}
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}
