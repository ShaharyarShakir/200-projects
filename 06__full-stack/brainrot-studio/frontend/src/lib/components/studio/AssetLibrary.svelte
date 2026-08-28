<script lang="ts">
	import type { Asset, AssetType } from '$lib/types/asset';
	import type { Scene } from '$lib/types/video';
	import {
		getAssetUrl,
		deleteAsset,
		updateAsset,
		retryAssetProcessing
	} from '$lib/api/assets';
	import { studio } from '$lib/state/video-studio.svelte';

	import { Upload, Trash2, Music, Image as ImageIcon, Video as VideoIcon, FileText, CheckCircle2, AlertCircle, RefreshCw, X, FolderOpen } from 'lucide-svelte';

	interface Props {
		projectId: string;
		videoId: string;
		assets: Asset[];
		scenes: Scene[];
		onUpload: (file: File) => Promise<void>;
	}

	let { projectId, videoId, assets, scenes, onUpload }: Props = $props();

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);
	let selectedFilter = $state<'all' | AssetType>('all');

	// Cache for presigned URLs
	let assetUrls = $state<Record<string, string>>({});

	let filteredAssets = $derived(
		selectedFilter === 'all'
			? assets
			: assets.filter((a) => a.asset_type === selectedFilter)
	);

	function openFilePicker() {
		uploadError = null;
		fileInput.click();
	}

	async function handleFiles(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		try {
			isUploading = true;
			uploadError = null;
			await onUpload(file);
		} catch (err: any) {
			uploadError = err?.message || 'Failed to upload asset';
		} finally {
			isUploading = false;
			if (fileInput) fileInput.value = '';
		}
	}

	async function loadAssetUrl(assetId: string) {
		if (assetUrls[assetId]) return;
		try {
			const res = await getAssetUrl(projectId, videoId, assetId);
			assetUrls = { ...assetUrls, [assetId]: res.url };
		} catch (err) {
			console.error(`Failed to load URL for asset ${assetId}:`, err);
		}
	}

	$effect(() => {
		for (const asset of assets) {
			if (!assetUrls[asset.id]) {
				loadAssetUrl(asset.id);
			}
		}
	});

	async function handleDelete(assetId: string) {
		if (!confirm('Are you sure you want to delete this asset?')) return;
		try {
			await deleteAsset(projectId, videoId, assetId);
			studio.removeAssetFromState(assetId);
		} catch (err: any) {
			alert(err?.message || 'Failed to delete asset');
		}
	}

	async function handleRetry(assetId: string) {
		try {
			const updated = await retryAssetProcessing(projectId, videoId, assetId);
			studio.updateAssetInState(assetId, updated);
		} catch (err: any) {
			alert(err?.message || 'Failed to retry asset processing');
		}
	}

	async function handleAssignScene(assetId: string, event: Event) {
		const select = event.target as HTMLSelectElement;
		const sceneId = select.value === '' ? null : select.value;
		try {
			const updated = await updateAsset(projectId, videoId, assetId, { scene_id: sceneId });
			studio.updateAssetInState(assetId, { scene_id: updated.scene_id });
		} catch (err: any) {
			alert(err?.message || 'Failed to assign scene');
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="flex h-full flex-col bg-[#0b0d14] text-gray-100">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-white/10 p-4 bg-white/5 backdrop-blur-md">
		<div class="flex items-center gap-2">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
				<FolderOpen class="h-4 w-4" />
			</div>
			<div>
				<h2 class="font-heading text-sm font-bold text-white tracking-wide">Asset Library</h2>
				<p class="text-[10px] font-mono text-gray-400">
					{assets.length} {assets.length === 1 ? 'file' : 'files'}
				</p>
			</div>
		</div>

		<button
			class="btn-emerald flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all"
			onclick={openFilePicker}
			disabled={isUploading}
		>
			{#if isUploading}
				<RefreshCw class="h-3.5 w-3.5 animate-spin" />
				<span>Uploading...</span>
			{:else}
				<Upload class="h-3.5 w-3.5" />
				<span>Upload</span>
			{/if}
		</button>


		<input
			bind:this={fileInput}
			type="file"
			class="hidden"
			accept="image/*,video/*,audio/*,font/*"
			onchange={handleFiles}
		/>
	</div>

	{#if uploadError}
		<div class="m-3 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex justify-between items-center">
			<span>{uploadError}</span>
			<button class="text-rose-400 hover:text-white" onclick={() => (uploadError = null)}>✕</button>
		</div>
	{/if}

	<!-- Type Filter Pills -->
	<div class="flex gap-1 overflow-x-auto border-b border-neutral-800 p-2 text-xs">
		{#each ['all', 'image', 'video', 'audio', 'font'] as type}
			<button
				class="px-2.5 py-1 rounded-full capitalize font-medium transition-colors {selectedFilter === type
					? 'bg-neutral-700 text-white'
					: 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}"
				onclick={() => (selectedFilter = type as any)}
			>
				{type}
			</button>
		{/each}
	</div>

	<!-- Asset Grid -->
	<div class="flex-1 overflow-y-auto p-3">
		{#if filteredAssets.length === 0}
			<div class="flex h-48 flex-col items-center justify-center text-center">
				<FolderOpen class="h-8 w-8 text-gray-600 mb-2" />
				<p class="text-xs font-medium text-gray-400">No assets found</p>
				<p class="text-[11px] text-gray-600">Upload media to use in your scenes</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-2.5">
				{#each filteredAssets as asset (asset.id)}
					<div class="group relative flex flex-col rounded-2xl border border-white/5 bg-white/5 p-3 hover:border-white/20 transition-all">
						<div class="flex items-start gap-3">
							<!-- Media Thumbnail / Icon -->
							<div class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/40 flex items-center justify-center border border-white/10 relative">
								{#if asset.thumbnail_url}
									<img
										src={asset.thumbnail_url}
										alt={asset.filename}
										class="h-full w-full object-cover"
									/>
								{:else if asset.asset_type === 'image' && assetUrls[asset.id]}
									<img
										src={assetUrls[asset.id]}
										alt={asset.filename}
										class="h-full w-full object-cover"
									/>
								{:else if asset.asset_type === 'video' && assetUrls[asset.id]}
									<video
										src={assetUrls[asset.id]}
										class="h-full w-full object-cover"
										muted
									></video>
								{:else if asset.asset_type === 'audio'}
									<Music class="h-6 w-6 text-purple-400" />
								{:else}
									<span class="text-[10px] uppercase text-gray-400 font-bold">
										{asset.asset_type}
									</span>
								{/if}

								{#if asset.processing_status === 'pending' || asset.processing_status === 'processing'}
									<div class="absolute inset-0 bg-black/70 flex items-center justify-center">
										<RefreshCw class="h-4 w-4 animate-spin text-cyan-400" />
									</div>
								{/if}
							</div>

							<!-- Details -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between gap-1">
									<p class="truncate text-xs font-semibold text-white" title={asset.filename}>
										{asset.filename}
									</p>

									<button
										class="text-gray-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
										title="Delete asset"
										onclick={() => handleDelete(asset.id)}
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								</div>


								<!-- Processing Badges & Metadata -->
								<div class="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
									<span class="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-neutral-300">
										{asset.asset_type}
									</span>
									<span>{formatBytes(asset.size_bytes)}</span>

									{#if asset.width && asset.height}
										<span>• {asset.width}×{asset.height}</span>
									{/if}

									{#if asset.duration_seconds}
										<span>• {formatDuration(asset.duration_seconds)}</span>
									{/if}
								</div>

								<!-- Processing Status Indicator -->
								<div class="mt-1.5 flex items-center justify-between">
									{#if asset.processing_status === 'pending' || asset.processing_status === 'processing'}
										<span class="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
											<span class="loading loading-spinner loading-xs"></span>
											Processing...
										</span>
									{:else if asset.processing_status === 'failed'}
										<div class="flex items-center gap-2">
											<span class="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
												✕ Failed
											</span>
											<button
												class="btn btn-xs bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900"
												onclick={() => handleRetry(asset.id)}
											>
												Retry
											</button>
										</div>
									{:else}
										<span class="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
											✓ Ready
										</span>
									{/if}
								</div>

								<!-- Audio Player Inline if Audio -->
								{#if asset.asset_type === 'audio' && assetUrls[asset.id]}
									<audio controls src={assetUrls[asset.id]} class="mt-2 h-7 w-full text-xs"></audio>
								{/if}

								<!-- Scene Assignment Select -->
								<div class="mt-2 flex items-center gap-1.5">
									<label for="scene-select-{asset.id}" class="text-[11px] text-neutral-400 whitespace-nowrap">Scene:</label>
									<select
										id="scene-select-{asset.id}"
										class="select select-xs bg-neutral-900 border-neutral-800 text-xs w-full text-neutral-200 focus:border-neutral-700"
										value={asset.scene_id ?? ''}
										onchange={(e) => handleAssignScene(asset.id, e)}
									>
										<option value="">Unassigned (Library)</option>
										{#each scenes as scene, idx}
											<option value={scene.id}>
												Scene {idx + 1} {scene.dialogue ? `(${scene.dialogue.slice(0, 15)}...)` : ''}
											</option>
										{/each}
									</select>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
