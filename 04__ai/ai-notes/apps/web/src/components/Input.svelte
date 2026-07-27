<script lang="ts">
	interface Props {
		value?: string;
		label?: string;
		type?: string;
		id: string;
		required?: boolean;
		placeholder?: string;
		error?: string;
		class?: string;
	}

	let {
		value = $bindable(''),
		label,
		type = 'text',
		id,
		required = false,
		placeholder = '',
		error = '',
		class: customClass = '',
		...restProps
	}: Props = $props();
</script>

<div class="flex w-full flex-col items-start space-y-2 {customClass}">
	{#if label}
		<label for={id} class="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
			{label}
		</label>
	{/if}

	<div class="relative w-full">
		<input
			{type}
			{id}
			bind:value
			{required}
			{placeholder}
			class="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-violet-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-slate-950 dark:focus:border-violet-500 focus:outline-none"
			class:border-red-500={error}
			class:focus:border-red-500={error}
			class:focus:ring-red-500={error}
			{...restProps}
		/>
	</div>

	{#if error}
		<p class="animate-pulse text-xs font-medium text-red-400">
			{error}
		</p>
	{/if}
</div>
