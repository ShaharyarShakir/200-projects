<script lang="ts">
	import type { QAReportResponse, QAIssue } from '$lib/api/qa';
	import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Cpu, RefreshCw, AlertCircle } from 'lucide-svelte';

	import { Wrench } from 'lucide-svelte';

	interface Props {
		report: QAReportResponse;
		onRepairScene?: (sceneId: string, code: string) => void;
	}

	let { report, onRepairScene }: Props = $props();


	function getScoreColor(score: number) {
		if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
		if (score >= 75) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
		return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
	}

	function getSeverityBadge(severity: QAIssue['severity']) {
		switch (severity) {
			case 'critical':
			case 'error':
				return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
			case 'warning':
				return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
			default:
				return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
		}
	}
</script>

<div class="rounded-2xl border border-white/10 bg-[#0d0f17] p-4 shadow-xl space-y-4">
	<!-- QA Header Bar -->
	<div class="flex items-center justify-between border-b border-white/10 pb-3">
		<div class="flex items-center gap-2.5">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
				<ShieldCheck class="h-5 w-5" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-white tracking-wide">AI Video QA Inspection</h3>
				<p class="text-[11px] text-gray-400">Ran {report.checks_run} media, timeline, & creative checks</p>
			</div>
		</div>

		<!-- Pass/Fail Badge -->
		<div class="flex items-center gap-2">
			{#if report.passed}
				<span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-full">
					<CheckCircle2 class="h-3.5 w-3.5" /> QA Passed
				</span>
			{:else}
				<span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-400 bg-rose-500/15 border border-rose-500/30 rounded-full">
					<AlertTriangle class="h-3.5 w-3.5" /> Needs Review
				</span>
			{/if}
		</div>
	</div>

	<!-- Score Gauge Banner -->
	<div class="flex items-center justify-between p-3.5 rounded-xl border {getScoreColor(report.score)}">
		<div class="space-y-0.5">
			<div class="text-[11px] uppercase tracking-wider font-semibold text-gray-300">Overall Quality Score</div>
			<div class="text-xs text-gray-400">Attempt #{report.attempt} (Auto-repaired if issues detected)</div>
		</div>
		<div class="text-2xl font-black font-mono tracking-tight">{report.score}<span class="text-sm font-normal text-gray-400">/100</span></div>
	</div>

	<!-- Itemized Issues List -->
	{#if report.issues && report.issues.length > 0}
		<div class="space-y-2">
			<div class="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
				<span>Detected Inspection Items ({report.issues.length})</span>
			</div>
			<div class="space-y-2 max-h-48 overflow-y-auto pr-1">
				{#each report.issues as issue}
					<div class="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
						<div class="space-y-1 flex-1">
							<div class="flex items-center gap-2">
								<span class="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md border {getSeverityBadge(issue.severity)}">
									{issue.category}
								</span>
								<span class="font-mono text-[11px] font-bold text-gray-200">{issue.code}</span>
							</div>
							<p class="text-gray-300 text-[11px] leading-relaxed">{issue.message}</p>
						</div>

						{#if issue.repairable && issue.scene_id && onRepairScene}
							<button
								onclick={() => onRepairScene?.(issue.scene_id!, issue.code)}
								class="px-2.5 py-1 text-[11px] font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg flex items-center gap-1 transition-all shrink-0"
								title="Trigger localized AI repair for this scene"
							>
								<Wrench class="h-3 w-3" />
								<span>Repair</span>
							</button>
						{/if}
					</div>
				{/each}

			</div>
		</div>
	{:else}
		<div class="flex items-center justify-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs gap-2">
			<CheckCircle2 class="h-4 w-4" />
			<span>Zero issues detected. Rendered short video meets all broadcast QA standards!</span>
		</div>
	{/if}
</div>
