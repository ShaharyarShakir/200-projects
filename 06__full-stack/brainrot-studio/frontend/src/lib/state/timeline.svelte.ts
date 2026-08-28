import type {
	Caption,
	Composition,
	SceneAsset,
	SceneWithAssets,
	Timeline,
	Track
} from '$lib/types/timeline';

export class TimelineState {
	composition = $state<Composition>({
		id: '',
		video_id: '',
		width: 1080,
		height: 1920,
		fps: 30,
		duration_ms: 0
	});

	scenes = $state<SceneWithAssets[]>([]);
	tracks = $state<Track[]>([]);
	captions = $state<Caption[]>([]);

	currentTimeMs = $state<number>(0);
	selectedSceneId = $state<string | null>(null);
	selectedAssetId = $state<string | null>(null);

	isPlaying = $state<boolean>(false);
	pixelsPerSecond = $state<number>(100);
	isAutosaving = $state<boolean>(false);

	get durationMs(): number {
		return this.scenes.reduce((total, scene) => total + scene.duration_ms, 0);
	}

	get activeScene(): SceneWithAssets | null {
		if (this.scenes.length === 0) return null;
		const cur = this.currentTimeMs;
		const found = this.scenes.find(
			(s) => cur >= s.start_ms && cur < s.start_ms + s.duration_ms
		);
		return found ?? this.scenes[this.scenes.length - 1];
	}

	get selectedScene(): SceneWithAssets | null {
		if (!this.selectedSceneId) return this.activeScene;
		return this.scenes.find((s) => s.id === this.selectedSceneId) ?? null;
	}

	setTimeline(data: Timeline) {
		this.composition = data.composition;
		this.scenes = data.scenes;
		this.tracks = data.tracks;
		this.captions = data.captions;

		if (this.scenes.length > 0 && !this.selectedSceneId) {
			this.selectedSceneId = this.scenes[0].id;
		}
	}

	selectScene(id: string | null) {
		this.selectedSceneId = id;
		this.selectedAssetId = null;
		if (id) {
			const sc = this.scenes.find((s) => s.id === id);
			if (sc) {
				this.currentTimeMs = sc.start_ms;
			}
		}
	}

	selectAsset(id: string | null) {
		this.selectedAssetId = id;
	}

	setCurrentTime(timeMs: number) {
		const maxTime = Math.max(this.durationMs, 1000);
		this.currentTimeMs = Math.max(0, Math.min(timeMs, maxTime));
	}

	togglePlay() {
		this.isPlaying = !this.isPlaying;
	}

	setPixelsPerSecond(px: number) {
		this.pixelsPerSecond = Math.max(20, Math.min(500, px));
	}

	timeToPixels(timeMs: number): number {
		return (timeMs / 1000) * this.pixelsPerSecond;
	}

	pixelsToTime(px: number): number {
		return (px / this.pixelsPerSecond) * 1000;
	}

	// Local optimistic recalculation for instant UI feedback
	recalculatePositions() {
		let current = 0;
		this.scenes = this.scenes.map((sc, idx) => {
			const updated = {
				...sc,
				order: idx,
				position: idx,
				start_ms: current
			};
			current += sc.duration_ms;
			return updated;
		});
		this.composition.duration_ms = current;
	}

	optimisticReorder(sceneIds: string[]) {
		const sceneMap = new Map(this.scenes.map((s) => [s.id, s]));
		const reordered: SceneWithAssets[] = [];
		for (const id of sceneIds) {
			const s = sceneMap.get(id);
			if (s) reordered.push(s);
		}
		this.scenes = reordered;
		this.recalculatePositions();
	}

	optimisticUpdateSceneDuration(sceneId: string, durationMs: number) {
		const sc = this.scenes.find((s) => s.id === sceneId);
		if (sc) {
			sc.duration_ms = Math.max(500, durationMs);
			this.recalculatePositions();
		}
	}

	optimisticUpdateAssetTransform(
		sceneAssetId: string,
		transform: Partial<Pick<SceneAsset, 'x' | 'y' | 'scale' | 'rotation' | 'opacity'>>
	) {
		for (const scene of this.scenes) {
			const asset = scene.assets.find((a) => a.id === sceneAssetId);
			if (asset) {
				Object.assign(asset, transform);
				break;
			}
		}
	}
}

export const timelineState = new TimelineState();
