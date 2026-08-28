<script lang="ts">
	import { onMount } from 'svelte';
	import { getLatestQAReport, getQAHistory, repairScene, type QAReportResponse, type QAHistoryResponse } from '$lib/api/qa';
	import QAReportCard from '$lib/components/studio/QAReportCard.svelte';
	import { toast } from '$lib/state/toast.svelte';
	import { studio } from '$lib/state/video-studio.svelte';
	import { getTimeline } from '$lib/api/timeline';
	import { timelineState } from '$lib/state/timeline.svelte';
	import { ShieldCheck, History, RefreshCw, Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-svelte';

	interface Props {
		projectId: string;
		videoId: string;
		jobId?: string;
	}

	let { projectId, videoId, jobId }: Props = $props();

	let report = $state<QAReportResponse | null>(null);
	let history = $state<QAHistoryResponse | null>(null);
	let loading = $state(false);
	let repairingSceneId = $state<string | null>(null);
	let activeSubTab = $state<'report' | 'history'>('report');

	async function loadQAData() {
		if (!jobId) return;
		loading = true;
		try {
			const [reportRes, historyRes] = await Promise.all([
				getLatestQAReport(projectId, videoId, jobId),
				getQAHistory(projectId, videoId, jobId)
			]);
			report = reportRes;
			history = historyRes;
		} catch (err) {
			console.log('No existing QA report found for job:', jobId);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (jobId) {
			loadQAData();
		}
	});

	async function handleRepairScene(sceneId: string, issueCode: string) {
		if (repairingSceneId) return;
		repairingSceneId = sceneId;
		toast.show(`Triggering AI repair for issue ${issueCode}...`, 'info');

		try {
			await repairScene(projectId, videoId, sceneId, `Repair issue ${issueCode}`, 'SCENE');
			toast.show('Scene repaired successfully!', 'success');

			// Refresh timeline and QA report
			const updatedTimeline = await getTimeline(projectId, videoId);
			timelineState.setTimeline(updatedTimeline);

			if (jobId) {
				await loadQAData();
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to execute scene repair';
			toast.show(msg, 'error');
		} finally {
			repairingSceneId = null;
		}
	}
</script>

<div class="space-y-4 p-4 bg-[#0b0d14]">
	<!-- QA Header & Refresh Button -->
	<div class="flex items-center justify-between border-b border-white/10 pb-3">
		<div class="flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
				<ShieldCheck class="h-4 w-4" />
			</div>
			<div>
				<h2 class="font-heading text-sm font-bold text-white tracking-wide">QA & Repair Center</h2>
				<p class="text-[10px] text-gray-400">Automated video inspection & self-correcting engine</p>
			</div>
		</div>

		<button
			onclick={loadQAData}
			disabled={loading || !jobId}
			class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
			title="Refresh QA report"
		>
			<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
		</button>
	</div>

	<!-- Sub-tab Navigation -->
	<div class="flex rounded-xl bg-white/5 p-1 gap-1 border border-white/5">
		<button
			onclick={() => (activeSubTab = 'report')}
			class="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 {activeSubTab === 'report' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white'}"
		>
			<ShieldCheck class="h-3.5 w-3.5" />
			<span>Inspection Report</span>
		</button>
		<button
			onclick={() => (activeSubTab = 'history')}
			class="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 {activeSubTab === 'history' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white'}"
		>
			<History class="h-3.5 w-3.5" />
			<span>Repair History</span>
			{#if history?.repair_attempts && history.repair_attempts.length > 0}
				<span class="badge badge-xs bg-purple-500/30 text-purple-200 border-none font-mono">
					{history.repair_attempts.length}
				</span>
			{/if}
		</button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="flex flex-col items-center gap-2">
				<RefreshCw class="h-6 w-6 animate-spin text-purple-400" />
				<span class="text-xs text-gray-400">Loading QA Inspection Data...</span>
			</div>
		</div>
	{:else if activeSubTab === 'report'}
		{#if report}
			<QAReportCard {report} onRepairScene={handleRepairScene} />
		{:else}
			<div class="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/10 bg-white/5 text-center space-y-3">
				<ShieldCheck class="h-10 w-10 text-gray-500" />
				<div class="space-y-1">
					<h4 class="text-xs font-bold text-gray-300">No QA Report Available</h4>
					<p class="text-[11px] text-gray-500 max-w-xs">
						Generate a video using the AI Generate modal to automatically trigger pre-render & post-render QA checks.
					</p>
				</div>
			</div>
		{/if}
	{:else if activeSubTab === 'history'}
		{#if history?.repair_attempts && history.repair_attempts.length > 0}
			<div class="space-y-2">
				<div class="text-[11px] uppercase font-semibold text-gray-400 tracking-wider">Automated Repair Trail</div>
				<div class="space-y-2 max-h-80 overflow-y-auto pr-1">
					{#each history.repair_attempts as attempt}
						<div class="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5 text-xs">
							<div class="flex items-center justify-between">
								<span class="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
									{attempt.repair_type}
								</span>
								<span class="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
									<Clock class="h-3 w-3" />
									{new Date(attempt.created_at).toLocaleTimeString()}
								</span>
							</div>
							<p class="text-gray-300 text-[11px] leading-relaxed">{attempt.reason}</p>
							<div class="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
								<CheckCircle2 class="h-3 w-3" />
								<span>Status: {attempt.status}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/10 bg-white/5 text-center space-y-3">
				<History class="h-10 w-10 text-gray-500" />
				<div class="space-y-1">
					<h4 class="text-xs font-bold text-gray-300">No Repair Attempts Recorded</h4>
					<p class="text-[11px] text-gray-500">
						When QA detects non-passing scores or audio gaps, automatic repair retries will be logged here.
					</p>
				</div>
			</div>
		{/if}
	{/if}
</div>
