<script lang="ts">
	import type { Project } from '$lib/types/project';
	import { Folder, Video, Plus, MoreVertical, Trash2, Sparkles } from 'lucide-svelte';


	let {
		project,
		onViewVideos,
		onCreateVideo,
		onDelete
	}: {
		project: Project;
		onViewVideos: (p: Project) => void;
		onCreateVideo: (p: Project) => void;
		onDelete: (p: Project) => void;
	} = $props();

	function formatDate(dateStr: string) {
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}
</script>

<div class="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-obsidian-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10">
	<!-- Card Top Section -->
	<div class="space-y-4">
		<div class="flex items-start justify-between gap-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30">
				<Folder class="h-6 w-6" />
			</div>

			<!-- Dropdown Menu -->
			<div class="dropdown dropdown-end">
				<button tabindex="0" class="btn btn-ghost btn-xs btn-square text-gray-400 hover:text-white" aria-label="Project Actions">
					<MoreVertical class="h-4 w-4" />
				</button>
				<ul class="dropdown-content menu z-30 w-44 rounded-xl border border-white/10 bg-gray-900/95 p-2 shadow-2xl backdrop-blur-xl">
					<li>
						<button onclick={() => onViewVideos(project)} class="text-xs font-medium text-gray-200 hover:bg-emerald-500/20 hover:text-emerald-300">
							<Video class="h-3.5 w-3.5 mr-1" /> View Videos
						</button>
					</li>
					<li>
						<button onclick={() => onCreateVideo(project)} class="text-xs font-medium text-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300">
							<Plus class="h-3.5 w-3.5 mr-1" /> Add Video
						</button>
					</li>
					<div class="my-1 border-t border-white/10"></div>
					<li>
						<button onclick={() => onDelete(project)} class="text-xs font-medium text-red-400 hover:bg-red-500/20">
							<Trash2 class="h-3.5 w-3.5 mr-1" /> Delete Project
						</button>
					</li>
				</ul>
			</div>
		</div>

		<div>
			<h3 class="font-heading text-xl font-bold text-white transition-colors group-hover:text-emerald-300">
				{project.name}
			</h3>
			<p class="mt-1 line-clamp-2 text-xs text-gray-400 leading-relaxed">
				{project.description || 'No project description provided.'}
			</p>
		</div>
	</div>

	<!-- Card Footer Section -->
	<div class="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
		<span class="text-[11px] font-mono text-gray-500">
			Created {formatDate(project.created_at)}
		</span>

		<div class="flex items-center gap-2">
			<button
				onclick={() => onViewVideos(project)}
				class="btn btn-ghost btn-xs text-gray-300 hover:text-white rounded-xl px-2 text-[11px] flex items-center gap-1"
			>
				<Video class="h-3 w-3 text-cyan-400" />
				<span>Videos</span>
			</button>
			<button
				onclick={() => onCreateVideo(project)}
				class="btn-emerald btn-xs px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
				title="Create new video and trigger AI generation"
			>
				<Sparkles class="h-3 w-3" />
				<span>+ Video</span>
			</button>
		</div>
	</div>

</div>
```...
