<script lang="ts">
	import { createProject } from '$lib/api/projects';
	import { toast } from '$lib/state/toast.svelte';
	import type { Project } from '$lib/types/project';
	import { FolderPlus, X } from 'lucide-svelte';

	let {
		isOpen,
		onClose,
		onCreated
	}: {
		isOpen: boolean;
		onClose: () => void;
		onCreated: (project: Project) => void;
	} = $props();

	let name = $state('');
	let description = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		if (!name.trim()) {
			error = 'Project name is required';
			return;
		}

		error = '';
		loading = true;

		try {
			const project = await createProject({
				name: name.trim(),
				description: description.trim() || undefined
			});

			toast.show(`Project "${project.name}" created!`, 'success');
			onCreated(project);

			// Reset form
			name = '';
			description = '';
			onClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create project';
			toast.show(error, 'error');
		} finally {
			loading = false;
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<button
			tabindex="-1"
			class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
			onclick={onClose}
			aria-label="Close Modal"
		></button>

		<!-- Modal Container -->
		<div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-obsidian-card p-6 shadow-2xl backdrop-blur-2xl animate-fade-in z-10">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-white/10 pb-4">
				<div class="flex items-center gap-2.5">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
						<FolderPlus class="h-5 w-5" />
					</div>
					<h2 class="font-heading text-lg font-bold text-white">Create New Project</h2>
				</div>
				<button
					onclick={onClose}
					class="btn btn-ghost btn-xs btn-square text-gray-400 hover:text-white"
					aria-label="Close"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Error Alert -->
			{#if error}
				<div class="alert alert-error mt-4 text-xs">
					<span>{error}</span>
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="mt-5 space-y-4">
				<div>
					<label for="project-name-input" class="block text-xs font-semibold tracking-wider text-gray-300 uppercase mb-1.5">
						Project Name *
					</label>
					<input
						id="project-name-input"
						type="text"
						bind:value={name}
						placeholder="e.g. Daily Reddit Stories Channel"
						class="input input-bordered w-full bg-white/5 border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder:text-gray-600 rounded-xl"
						required
					/>
				</div>

				<div>
					<label for="project-desc-input" class="block text-xs font-semibold tracking-wider text-gray-300 uppercase mb-1.5">
						Description (Optional)
					</label>
					<textarea
						id="project-desc-input"
						bind:value={description}
						placeholder="Target audience, theme, or notes..."
						class="textarea textarea-bordered w-full bg-white/5 border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder:text-gray-600 rounded-xl h-24"
					></textarea>
				</div>

				<div class="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={onClose}
						class="btn btn-ghost text-xs text-gray-400 hover:text-white rounded-xl"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="btn-emerald px-5 py-2 text-xs font-semibold rounded-xl"
						disabled={loading}
					>
						{loading ? 'Creating...' : 'Create Project'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
