<script lang="ts">
	import SceneCanvas from '$lib/components/timeline/SceneCanvas.svelte';
	import { updateSceneAsset } from '$lib/api/timeline';
	import { studio } from '$lib/state/video-studio.svelte';
	import { toast } from '$lib/state/toast.svelte';

	let {
		projectId,
		videoId
	}: {
		projectId?: string;
		videoId?: string;
	} = $props();

	async function handleUpdateAssetTransform(assetId: string, x: number, y: number) {
		if (!projectId || !videoId) return;
		try {
			await updateSceneAsset(projectId, videoId, assetId, { x, y });
			toast.show('Asset position autosaved', 'success');
		} catch (err: any) {
			toast.show(err?.message || 'Failed saving asset transform', 'error');
		}
	}
</script>

<div class="h-full w-full bg-[#07080c] relative flex items-center justify-center overflow-hidden">
	<SceneCanvas onUpdateAssetTransform={handleUpdateAssetTransform} />
</div>
