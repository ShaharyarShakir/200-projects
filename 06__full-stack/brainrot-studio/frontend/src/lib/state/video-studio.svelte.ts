import type { Asset } from '$lib/types/asset';
import type {
	Scene,
	Video
} from '$lib/types/video';

class VideoStudioState {
	video = $state<Video | null>(null);

	scenes = $state<Scene[]>([]);

	assets = $state<Asset[]>([]);

	selectedSceneId = $state<string | null>(
		null
	);

	selectedAssetId = $state<string | null>(
		null
	);

	activeTab = $state<
		'scene' | 'assets' | 'settings' | 'qa'
	>('scene');

	isSaving = $state(false);

	selectedScene = $derived(
		this.scenes.find(
			(scene) =>
				scene.id === this.selectedSceneId
		) ?? null
	);

	selectedAsset = $derived(
		this.assets.find(
			(asset) =>
				asset.id === this.selectedAssetId
		) ?? null
	);

	setVideo(video: Video) {
		this.video = video;
	}

	setScenes(scenes: Scene[]) {
		this.scenes = scenes;

		if (
			scenes.length > 0 &&
			!this.selectedSceneId
		) {
			this.selectedSceneId =
				scenes[0].id;
		}
	}

	setAssets(assets: Asset[]) {
		this.assets = assets;
	}

	setActiveTab(
		tab: 'scene' | 'assets' | 'settings' | 'qa'
	) {
		this.activeTab = tab;
	}


	selectScene(id: string) {
		this.selectedSceneId = id;
	}

	selectAsset(id: string | null) {
		this.selectedAssetId = id;
	}

	addScene(scene: Scene) {
		this.scenes = [...this.scenes, scene];
		this.selectedSceneId = scene.id;
	}

	updateSceneInState(sceneId: string, partial: Partial<Scene>) {
		this.scenes = this.scenes.map((s) => (s.id === sceneId ? { ...s, ...partial } : s));
	}

	removeSceneFromState(sceneId: string) {
		this.scenes = this.scenes.filter((s) => s.id !== sceneId);
		if (this.selectedSceneId === sceneId) {
			this.selectedSceneId = this.scenes[0]?.id ?? null;
		}
	}

	addAsset(asset: Asset) {
		this.assets = [asset, ...this.assets];
	}

	updateAssetInState(assetId: string, partial: Partial<Asset>) {
		this.assets = this.assets.map((a) => (a.id === assetId ? { ...a, ...partial } : a));
	}

	removeAssetFromState(assetId: string) {
		this.assets = this.assets.filter((a) => a.id !== assetId);
		if (this.selectedAssetId === assetId) {
			this.selectedAssetId = null;
		}
	}
}

export const studio =
	new VideoStudioState();
