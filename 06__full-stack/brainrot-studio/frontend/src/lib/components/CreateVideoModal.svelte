<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/state/toast.svelte';
	import type { Project } from '$lib/types/project';
	import type { Video } from '$lib/types/video';

	import WizardHeader from './wizard/WizardHeader.svelte';
	import StepCharacters from './wizard/StepCharacters.svelte';
	import StepNiche from './wizard/StepNiche.svelte';
	import StepIdeas from './wizard/StepIdeas.svelte';
	import StepScript from './wizard/StepScript.svelte';
	import WizardFooter from './wizard/WizardFooter.svelte';

	import {
		fetchCharacters,
		fetchNiches,
		createGenerationSession,
		updateGenerationSession,
		generateSessionTopics,
		selectSessionTopic,
		generateSessionScript,
		regenerateSessionScene,
		renderSessionVideo,
		type Character,
		type GeneratedTopic,
		type GeneratedScript
	} from '$lib/api/wizard';

	let {
		project,
		isOpen,
		onClose,
		onCreated
	}: {
		project: Project | null;
		isOpen: boolean;
		onClose: () => void;
		onCreated: (video: Video) => void;
	} = $props();

	// Session & Step State (1: Characters, 2: Niche, 3: Topics, 4: Script)
	let sessionId = $state<string | null>(null);
	let currentStep = $state(1);
	let loading = $state(false);

	// Form & Pipeline Data
	let availableCharacters = $state<Character[]>([]);
	let numCharacters = $state(2);
	let scriptLanguage = $state('English');

	let selectedNiche = $state('Comedy');
	let customNiche = $state('');

	let generatedTopics = $state<GeneratedTopic[]>([]);
	let selectedTopicId = $state<string>('');
	let editedIdeaText = $state('');

	let generatedScript = $state<GeneratedScript | null>(null);

	// Hydrate session & default data
	$effect(() => {
		if (isOpen && !sessionId) {
			initSession();
		}
	});

	async function initSession() {
		loading = true;
		try {
			// Fetch characters & niches from backend
			const [charsData] = await Promise.all([fetchCharacters()]);
			availableCharacters = charsData.map((c, i) => ({
				...c,
				selected: i < 2 // Default select first 2
			}));

			const session = await createGenerationSession(project?.id);
			sessionId = session.id;
			currentStep = session.current_step || 1;
		} catch (err) {
			console.error('Failed to initialize generation session:', err);
		} finally {
			loading = false;
		}
	}

	async function handleNextStep() {
		if (!sessionId) return;
		loading = true;

		try {
			if (currentStep === 1) {
				// Characters -> Niche
				const selectedIds = availableCharacters.filter((c) => c.selected).map((c) => c.id);
				if (selectedIds.length === 0) {
					toast.show('Please select at least 1 character.', 'info');
					loading = false;
					return;
				}
				await updateGenerationSession(sessionId, { current_step: 2, character_ids: selectedIds });
				currentStep = 2;
			} else if (currentStep === 2) {
				// Niche -> Topics
				const nicheName = customNiche.trim() || selectedNiche;
				await updateGenerationSession(sessionId, { current_step: 3, niche: nicheName });
				const topics = await generateSessionTopics(sessionId);
				generatedTopics = topics;
				if (topics.length > 0) {
					selectedTopicId = topics[0].id;
					editedIdeaText = `${topics[0].title} — ${topics[0].premise}`;
				}
				currentStep = 3;
			} else if (currentStep === 3) {
				// Topics -> Script
				if (!selectedTopicId) {
					toast.show('Please select a topic first.', 'info');
					loading = false;
					return;
				}
				await selectSessionTopic(sessionId, selectedTopicId);
				const scriptRes = await generateSessionScript(sessionId);
				generatedScript = scriptRes;
				currentStep = 4;
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Wizard step failed';
			toast.show(msg, 'error');
		} finally {
			loading = false;
		}
	}

	async function handleRegenerateScene(sceneIdx: number, instruction: string) {
		if (!sessionId || !generatedScript) return;
		try {
			const updatedScene = await regenerateSessionScene(sessionId, sceneIdx, instruction);
			if (generatedScript.scenes && generatedScript.scenes[sceneIdx]) {
				generatedScript.scenes[sceneIdx] = updatedScene;
			}
			toast.show(`Scene ${sceneIdx + 1} regenerated!`, 'success');
		} catch (err) {
			toast.show('Scene regeneration failed.', 'error');
		}
	}

	async function handleFinalCreate() {
		if (!sessionId || !project) return;
		loading = true;

		try {
			const renderRes = await renderSessionVideo(sessionId);
			toast.show('Video pipeline compiled! Launching studio...', 'success');

			const videoObj: Video = {
				id: renderRes.video_id,
				project_id: project.id,
				title: generatedScript?.title || 'New Short',
				description: generatedScript?.hook || '',
				script: generatedScript ? JSON.stringify(generatedScript) : null,
				status: 'rendering',
				aspect_ratio: '9:16',
				width: 1080,
				height: 1920,
				fps: 30,
				duration_seconds: generatedScript?.estimated_duration || 35,
				output_url: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			onCreated(videoObj);
			onClose();
			await goto(`/projects/${project.id}/videos/${renderRes.video_id}`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to launch studio render';
			toast.show(msg, 'error');
		} finally {
			loading = false;
		}
	}

	// Adapt topics for StepIdeas display
	let adaptedIdeas = $derived(
		generatedTopics.map((t, idx) => ({
			id: t.id,
			numericId: idx + 1,
			title: t.title,
			description: t.premise
		}))
	);
</script>

{#if isOpen && project}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
		<!-- Dark Backdrop -->
		<button
			tabindex="-1"
			class="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
			onclick={onClose}
			aria-label="Close Pipeline Modal"
		></button>

		<!-- Main Modal Container -->
		<div class="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0d0f17] shadow-2xl overflow-hidden z-10 my-auto text-gray-100 flex flex-col max-h-[92vh]">
			
			<WizardHeader {currentStep} {onClose} />

			<!-- Pipeline Scrollable Content Area -->
			<div class="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
				{#if currentStep === 1}
					<StepCharacters
						bind:numCharacters
						bind:scriptLanguage
						bind:availableCharacters
					/>
				{:else if currentStep === 2}
					<StepNiche bind:customNiche bind:selectedNiche />
				{:else if currentStep === 3}
					<StepIdeas
						{selectedNiche}
						generatedIdeas={adaptedIdeas}
						bind:selectedIdeaId={selectedTopicId}
						bind:editedIdeaText
					/>
				{:else if currentStep === 4}
					<StepScript
						script={generatedScript}
						onRegenerateScene={handleRegenerateScene}
					/>
				{/if}
			</div>

			<WizardFooter
				bind:currentStep
				{loading}
				{onClose}
				onNext={handleNextStep}
				onFinalCreate={handleFinalCreate}
			/>
		</div>
	</div>
{/if}
