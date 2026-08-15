<script setup lang="ts">
import { gsap } from 'gsap'
import { Video, HardDrive, Film, UploadCloud, CheckCircle2, Clock, AlertCircle } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { academy } = useAcademy()
const pageContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  if (pageContainer.value) {
    gsap.from(pageContainer.value.querySelectorAll('.gsap-card'), {
      opacity: 0,
      y: 25,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power3.out'
    })
  }
})
</script>

<template>
  <div ref="pageContainer" class="space-y-8 select-none">
    <!-- Header Banner -->
    <div class="gsap-card bg-gradient-to-r from-purple-950/80 via-indigo-900/50 to-[#0c0919] p-8 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
          <Video class="w-3.5 h-3.5" />
          <span>Media Vault</span>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-white uppercase leading-tight">
          Video & <span class="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Media Library</span>
        </h1>
        <p class="text-slate-300 text-sm max-w-xl">
          Manage video uploads, HLS encoding status, and media assets for <strong class="text-white">{{ academy?.name || 'your academy' }}</strong>.
        </p>
      </div>

      <NuxtLink
        to="/admin/courses"
        class="px-5 py-3 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase flex items-center gap-2"
      >
        <UploadCloud class="w-4 h-4" />
        <span>Upload Video via Course Studio</span>
      </NuxtLink>
    </div>

    <!-- Media Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-3">
        <div class="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
          <Film class="w-5 h-5" />
        </div>
        <div>
          <div class="text-3xl font-black text-white">Garage S3</div>
          <div class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Storage Provider</div>
        </div>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-3">
        <div class="w-10 h-10 rounded-xl bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 flex items-center justify-center font-bold">
          <Video class="w-5 h-5" />
        </div>
        <div>
          <div class="text-3xl font-black text-white">HLS (m3u8)</div>
          <div class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Transcoding Engine</div>
        </div>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <div class="text-3xl font-black text-white">Scoped</div>
          <div class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Academy Isolation</div>
        </div>
      </div>
    </div>

    <!-- Media Storage Info Card -->
    <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-8 rounded-3xl shadow-xl backdrop-blur-md space-y-4">
      <div class="flex items-center gap-3">
        <HardDrive class="w-6 h-6 text-yellow-400" />
        <h3 class="text-xl font-black text-white uppercase">Academy Video Asset Scope</h3>
      </div>
      <p class="text-slate-300 text-sm leading-relaxed max-w-2xl">
        All original video uploads and transcoded HLS stream segments are automatically saved to your dedicated academy bucket path:
        <code class="block mt-2 px-3 py-2 bg-purple-950/60 border border-purple-800/50 rounded-xl text-yellow-400 font-mono text-xs">
          academies/{{ academy?.id || 'academy-id' }}/courses/{course_id}/lessons/{lesson_id}/
        </code>
      </p>
    </div>
  </div>
</template>
