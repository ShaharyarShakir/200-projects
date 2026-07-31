<script lang="ts">
	let {
		value = $bindable(''),
		type = 'text',
		label = '',
		placeholder = '',
		error = '',
		id = Math.random().toString(36).substring(2, 9),
		name = '',
		required = false,
		class: className = '',
		...rest
	} = $props<{
		value?: string;
		type?: string;
		label?: string;
		placeholder?: string;
		error?: string;
		id?: string;
		name?: string;
		required?: boolean;
		class?: string;
		[key: string]: any;
	}>();
</script>

<div class="flex w-full flex-col gap-1.5 {className}">
	{#if label}
		<label for={id} class="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}

	<input
		{id}
		{type}
		{name}
		{placeholder}
		{required}
		bind:value
		class="h-10 w-full rounded-lg border bg-zinc-950/60 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:ring-1 focus:outline-none
		{error
			? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
			: 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/20'}"
		{...rest}
	/>

	{#if error}
		<span class="text-red-450 mt-0.5 text-xs font-medium">{error}</span>
	{/if}
</div>
