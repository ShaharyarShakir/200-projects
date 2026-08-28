<script lang="ts">
	import { studio } from '$lib/state/video-studio.svelte';
	import { updateVideo } from '$lib/api/videos';
	import { toast } from '$lib/state/toast.svelte';
	import type { VideoAspectRatio } from '$lib/types/video';
	import { Settings, Sliders, Save, FileText, Monitor, RefreshCw } from 'lucide-svelte';

	interface Props {
		projectId: string;
		videoId: string;
	}

	let { projectId, videoId }: Props = $props();

	let title = $state('');
	let script = $state('');
	let aspectRatio = $state<VideoAspectRatio>('9:16');
	let resolutionStr = $state('1080x1920');
	let fps = $state(30);
	let saving = $state(false);

	// Sync local settings when video state is loaded/updated
	$effect(() => {
		const v = studio.video;
		if (v) {
			title = v.title ?? '';
			script = v.script ?? '';
			aspectRatio = v.aspect_ratio ?? '9:16';
			resolutionStr = `${v.width ?? 1080}x${v.height ?? 1920}`;
			fps = v.fps ?? 30;
		}
	});

	function parseResolution(res: string): { width: number; height: number } {
		switch (res) {
			case '720x1280':
				return { width: 720, height: 1280 };
			case '2160x3840':
				return { width: 2160, height: 3840 };
			case '1920x1080':
				return { width: 1920, height: 1080 };
			case '1080x1080':
				return { width: 1080, height: 1080 };
			case '1080x1920':
			default:
				return { width: 1080, height: 1920 };
		}
	}

	async function handleSaveSettings() {
		if (!studio.video || saving) return;
		saving = true;

		try {
			const { width, height } = parseResolution(resolutionStr);
			const updated = await updateVideo(projectId, videoId, {
				title: title || undefined,
				script: script || undefined,
				aspect_ratio: aspectRatio,
				width,
				height,
				fps
			});

			studio.setVideo(updated);
			toast.show('Video settings updated', 'success');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to update video settings';
			toast.show(msg, 'error');
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-5 p-5 bg-[#0b0d14] border-b border-white/10">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-white/10 pb-4">
		<div class="flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
				<Settings class="h-4 w-4" />
			</div>
			<div>
				<h2 class="font-heading text-sm font-bold text-white tracking-wide">
					Video Settings
				</h2>
				<p class="text-[10px] text-gray-400">
					Render format & script options
				</p>
			</div>
		</div>

		<button
			onclick={handleSaveSettings}
			disabled={saving}
			class="btn-emerald flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl"
		>
			<Save class="h-3.5 w-3.5" />
			<span>{saving ? 'Saving...' : 'Save'}</span>
		</button>
	</div>

	<!-- Title Input -->
	<div class="space-y-1.5">
		<label for="video-title" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
			Video Title
		</label>
		<input
			id="video-title"
			type="text"
			bind:value={title}
			placeholder="Video title..."
			class="input input-bordered w-full bg-white/5 border-white/10 focus:border-purple-500 text-xs text-white placeholder:text-gray-600 rounded-xl focus:outline-none transition-colors"
		/>
	</div>

	<!-- Aspect Ratio Select -->
	<div class="space-y-1.5">
		<label for="video-aspect-ratio" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
			<Sliders class="h-3.5 w-3.5 text-purple-400" />
			Aspect Ratio
		</label>
		<select
			id="video-aspect-ratio"
			bind:value={aspectRatio}
			class="select select-bordered w-full bg-white/5 border-white/10 focus:border-purple-500 text-xs text-white rounded-xl focus:outline-none"
		>
			<option value="9:16">9:16 (Portrait / Reels / Shorts / TikTok)</option>
			<option value="16:9">16:9 (Landscape / YouTube)</option>
			<option value="1:1">1:1 (Square / Instagram Post)</option>
		</select>
	</div>

	<!-- Resolution Select -->
	<div class="space-y-1.5">
		<label for="video-resolution" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
			<Monitor class="h-3.5 w-3.5 text-cyan-400" />
			Resolution
		</label>
		<select
			id="video-resolution"
			bind:value={resolutionStr}
			class="select select-bordered w-full bg-white/5 border-white/10 focus:border-cyan-500 text-xs text-white rounded-xl focus:outline-none"
		>
			<option value="1080x1920">1080 × 1920 (Standard HD Portrait)</option>
			<option value="720x1280">720 × 1280 (Fast Draft 720p)</option>
			<option value="2160x3840">2160 × 3840 (4K Ultra HD)</option>
			<option value="1920x1080">1920 × 1080 (Standard HD Landscape)</option>
			<option value="1080x1080">1080 × 1080 (Square 1:1 HD)</option>
		</select>
	</div>

	<!-- Frame Rate Select -->
	<div class="space-y-1.5">
		<label for="video-fps" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
			<RefreshCw class="h-3.5 w-3.5 text-amber-400" />
			Frame Rate (FPS)
		</label>
		<select
			id="video-fps"
			bind:value={fps}
			class="select select-bordered w-full bg-white/5 border-white/10 focus:border-amber-500 text-xs text-white rounded-xl focus:outline-none"
		>
			<option value={30}>30 FPS (Recommended)</option>
			<option value={60}>60 FPS (High Smoothness)</option>
			<option value={24}>24 FPS (Cinematic)</option>
		</select>
	</div>

	<!-- Full Script Text -->
	<div class="space-y-1.5">
		<label for="video-script" class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
			<FileText class="h-3.5 w-3.5 text-emerald-400" />
			Full Video Script Outline
		</label>
		<textarea
			id="video-script"
			bind:value={script}
			placeholder="Paste or write master video script here..."
			class="textarea textarea-bordered w-full bg-white/5 border-white/10 focus:border-emerald-500 text-xs text-white placeholder:text-gray-600 rounded-xl h-24 focus:outline-none transition-colors"
		></textarea>
	</div>
</div>
