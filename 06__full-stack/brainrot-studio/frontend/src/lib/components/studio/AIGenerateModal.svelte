<script lang="ts">
	import { Sparkles, Wand2, CheckCircle2, AlertCircle, X, Clock, Flame, Film, MessageSquareText, Cpu } from 'lucide-svelte';
	import { generateStory, getGenerationJob, applyStoryVersion } from '$lib/api/generation';
	import { getLatestQAReport, type QAReportResponse } from '$lib/api/qa';
	import { getAssets } from '$lib/api/assets';
	import { studio } from '$lib/state/video-studio.svelte';
	import QAReportCard from '$lib/components/studio/QAReportCard.svelte';
	import type { StoryPreview } from '$lib/types/ai';
	import { timelineState } from '$lib/state/timeline.svelte';
	import { toast } from '$lib/state/toast.svelte';

	let {
		projectId,
		videoId,
		isOpen = $bindable(false),
		onApplied
	}: {
		projectId: string;
		videoId: string;
		isOpen: boolean;
		onApplied?: () => void;
	} = $props();

	let prompt = $state(
		'Make a 30 second brainrot story about a broke college student who discovers his roommate is secretly rich.'
	);
	let targetDurationSec = $state(30);
	let tone = $state('chaotic');
	let language = $state('en');
	let provider = $state('gemini');

	let isGenerating = $state(false);
	let progress = $state(0);
	let statusMessage = $state('');
	let errorMsg = $state<string | null>(null);
	let generatedStory = $state<StoryPreview | null>(null);
	let qaReport = $state<QAReportResponse | null>(null);
	let isApplying = $state(false);

	let pollInterval: ReturnType<typeof setInterval> | null = null;

	function handleClose() {
		if (pollInterval) clearInterval(pollInterval);
		isOpen = false;
	}

	async function handleStartGeneration() {
		if (!prompt.trim()) {
			toast.show('Please enter a story prompt', 'error');
			return;
		}

		isGenerating = true;
		progress = 15;
		statusMessage = `Queuing AI Story Job using ${provider.toUpperCase()}...`;
		errorMsg = null;
		generatedStory = null;
		qaReport = null;

		try {
			const res = await generateStory(projectId, videoId, {
				prompt,
				target_duration_ms: targetDurationSec * 1000,
				tone,
				language,
				provider
			});

			const jobId = res.job_id;
			statusMessage = 'LangGraph Planner & Writer active...';

			pollInterval = setInterval(async () => {
				try {
					const job = await getGenerationJob(projectId, videoId, jobId);
					progress = Math.max(progress, job.progress);

					if (job.status === 'processing') {
						if (job.progress < 50) statusMessage = 'Drafting structured scenes & dialogue...';
						else if (job.progress < 85) statusMessage = 'Validating timeline rules & QA checks...';
					} else if (job.status === 'completed') {
						if (pollInterval) clearInterval(pollInterval);
						isGenerating = false;
						progress = 100;
						if (job.story_preview) {
							generatedStory = job.story_preview;
							toast.show('AI Story generated successfully!', 'success');
							try {
								qaReport = await getLatestQAReport(projectId, videoId, jobId);
							} catch (e) {
								console.error('Failed to fetch QA report:', e);
							}
						} else {
							errorMsg = 'Story preview data missing.';
						}
					} else if (job.status === 'failed') {
						if (pollInterval) clearInterval(pollInterval);
						isGenerating = false;
						errorMsg = job.error_message || 'AI Generation failed';
						toast.show(`Generation failed: ${errorMsg}`, 'error');
					}
				} catch (err) {
					console.error('Polling error:', err);
				}
			}, 1500);

		} catch (err) {
			isGenerating = false;
			errorMsg = err instanceof Error ? err.message : 'Failed to trigger AI generation';
			toast.show(errorMsg, 'error');
		}
	}

	async function handleApplyStory() {
		if (!generatedStory) return;
		isApplying = true;
		try {
			const timeline = await applyStoryVersion(
				projectId,
				videoId,
				generatedStory.story_version_id
			);
			timelineState.setTimeline(timeline);
			try {
				const assets = await getAssets(projectId, videoId);
				studio.setAssets(assets);
			} catch (e) {
				console.error('Failed updating studio assets:', e);
			}
			toast.show('Applied AI Story to Video Timeline!', 'success');
			onApplied?.();
			handleClose();
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to apply story';
			toast.show(msg, 'error');
		} finally {
			isApplying = false;
		}
	}

</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
		<div class="relative w-full max-w-3xl bg-[#0c0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
			<!-- Modal Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 via-emerald-900/20 to-black">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
						<Sparkles class="h-5 w-5 animate-pulse" />
					</div>
					<div>
						<h2 class="text-lg font-bold text-white tracking-wide flex items-center gap-2">
							AI Story & Scene Generator
							<span class="text-[10px] font-mono uppercase bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
								LangGraph + Ollama
							</span>
						</h2>
						<p class="text-xs text-gray-400">Generate structured 9:16 vertical shorts scenes & captions</p>
					</div>
				</div>

				<button
					onclick={handleClose}
					class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Modal Content Body -->
			<div class="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
				{#if !generatedStory && !isGenerating}
					<!-- Input Controls -->
					<div class="space-y-4">
						<div>
							<label for="ai-prompt" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
								Story Concept / Prompt
							</label>
							<textarea
								id="ai-prompt"
								bind:value={prompt}
								rows="3"
								placeholder="Describe your short video idea..."
								class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
							></textarea>
						</div>

						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<label for="provider-select" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1">
									<Cpu class="h-3.5 w-3.5 text-purple-400" /> AI Provider
								</label>
								<select
									id="provider-select"
									bind:value={provider}
									class="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
								>
									<option value="gemini" class="bg-gray-900">Gemini 2.5 Flash</option>
									<option value="ollama" class="bg-gray-900">Ollama (Local)</option>
								</select>
							</div>

							<div>
								<label for="duration-select" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1">
									<Clock class="h-3.5 w-3.5 text-emerald-400" /> Target Duration
								</label>
								<select
									id="duration-select"
									bind:value={targetDurationSec}
									class="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
								>
									<option value={15} class="bg-gray-900">15 Seconds</option>
									<option value={30} class="bg-gray-900">30 Seconds</option>
									<option value={45} class="bg-gray-900">45 Seconds</option>
									<option value={60} class="bg-gray-900">60 Seconds</option>
								</select>
							</div>

							<div>
								<label for="tone-select" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1">
									<Flame class="h-3.5 w-3.5 text-amber-400" /> Story Tone
								</label>
								<select
									id="tone-select"
									bind:value={tone}
									class="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
								>
									<option value="chaotic" class="bg-gray-900">Chaotic & Viral</option>
									<option value="funny" class="bg-gray-900">Funny & Absurd</option>
									<option value="dramatic" class="bg-gray-900">Dramatic Plot Twist</option>
									<option value="educational" class="bg-gray-900">Fast Educational</option>
								</select>
							</div>

							<div>
								<label for="lang-select" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
									Language
								</label>
								<select
									id="lang-select"
									bind:value={language}
									class="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
								>
									<option value="en" class="bg-gray-900">English</option>
									<option value="es" class="bg-gray-900">Spanish</option>
									<option value="fr" class="bg-gray-900">French</option>
									<option value="de" class="bg-gray-900">German</option>
								</select>
							</div>
						</div>

					</div>
				{:else if isGenerating}
					<!-- Generation Progress Screen -->
					<div class="py-12 flex flex-col items-center justify-center text-center space-y-6">
						<div class="relative w-20 h-20 flex items-center justify-center">
							<div class="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
							<Wand2 class="h-8 w-8 text-emerald-400 animate-pulse" />
						</div>

						<div class="space-y-2 max-w-md">
							<h3 class="text-lg font-bold text-white tracking-wide">
								Orchestrating Story Graph...
							</h3>
							<p class="text-xs text-emerald-400 font-mono">{statusMessage}</p>
						</div>

						<div class="w-full max-w-md bg-white/5 rounded-full h-3 overflow-hidden border border-white/10">
							<div
								class="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-300 rounded-full"
								style={`width: ${progress}%`}
							></div>
						</div>
					</div>
				{:else if generatedStory}
					<!-- Generated Story Preview Screen -->
					<div class="space-y-6">
						{#if qaReport}
							<QAReportCard report={qaReport} />
						{/if}

						<div class="p-4 bg-gradient-to-r from-emerald-950/40 to-black border border-emerald-500/30 rounded-2xl space-y-2">

							<div class="flex items-center justify-between">
								<h3 class="text-base font-extrabold text-white">
									{generatedStory.content.title}
								</h3>
								<div class="flex items-center gap-2">
									<span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-mono">
										Version {generatedStory.version}
									</span>
									<span class="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] font-mono">
										{generatedStory.content.target_duration_ms / 1000}s Total
									</span>
								</div>
							</div>
							<p class="text-xs text-gray-300">
								<span class="font-bold text-amber-400">Hook:</span> "{generatedStory.content.hook}"
							</p>
							<p class="text-xs text-gray-400 italic">
								Premise: {generatedStory.content.premise}
							</p>
						</div>

						<!-- Scene Cards -->
						<div class="space-y-3">
							<h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
								<Film class="h-3.5 w-3.5 text-emerald-400" />
								Generated Scene Composition ({generatedStory.content.scenes.length} Scenes)
							</h4>

							<div class="grid grid-cols-1 gap-3">
								{#each generatedStory.content.scenes as scene (scene.scene_number)}
									<div class="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
										<div class="flex items-center justify-between text-xs">
											<div class="flex items-center gap-2">
												<span class="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px]">
													S{scene.scene_number}
												</span>
												<span class="font-semibold text-white">{scene.purpose}</span>
											</div>
											<span class="font-mono text-gray-400">{scene.duration_ms / 1000}s</span>
										</div>

										<p class="text-xs text-gray-300 bg-black/30 p-2 rounded-lg border border-white/5">
											<span class="text-gray-500 font-semibold">Visual:</span> {scene.visual_description}
										</p>

										{#if scene.dialogue && scene.dialogue.length > 0}
											<div class="space-y-1">
												{#each scene.dialogue as d}
													<div class="flex items-start gap-2 text-xs text-cyan-300">
														<MessageSquareText class="h-3.5 w-3.5 mt-0.5 text-cyan-400 flex-shrink-0" />
														<span><strong class="text-cyan-200">{d.character}:</strong> "{d.text}"</span>
													</div>
												{/each}
											</div>
										{/if}

										{#if scene.caption}
											<div class="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-mono text-[11px] font-bold rounded-lg uppercase">
												🔥 {scene.caption}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				{#if errorMsg}
					<div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
						<AlertCircle class="h-4 w-4 text-red-400 flex-shrink-0" />
						<span>{errorMsg}</span>
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
				<button
					onclick={handleClose}
					disabled={isGenerating || isApplying}
					class="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
				>
					Cancel
				</button>

				{#if !generatedStory && !isGenerating}
					<button
						onclick={handleStartGeneration}
						class="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
					>
						<Wand2 class="h-4 w-4" />
						Generate Story
					</button>
				{:else if generatedStory}
					<div class="flex items-center gap-2">
						<button
							onclick={() => {
								generatedStory = null;
							}}
							class="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
						>
							Regenerate
						</button>
						<button
							onclick={handleApplyStory}
							disabled={isApplying}
							class="px-5 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
						>
							{#if isApplying}
								<span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
								Applying to Timeline...
							{:else}
								<CheckCircle2 class="h-4 w-4" />
								Use Story (Apply to Timeline)
							{/if}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
