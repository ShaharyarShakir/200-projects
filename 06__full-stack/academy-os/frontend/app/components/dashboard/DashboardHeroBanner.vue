<script setup lang="ts">
import { gsap } from 'gsap'

defineProps<{
  userName?: string
  progressPercent?: number
}>()

const mascotRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (mascotRef.value) {
    gsap.to(mascotRef.value, {
      y: -10,
      rotate: 2,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }
})
</script>

<template>
  <div class="relative w-full bg-gradient-to-r from-purple-950 via-indigo-900/80 to-[#0c0919] rounded-3xl p-6 sm:p-8 text-white border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col sm:flex-row items-center justify-between">
    <!-- Ambient background glow highlights -->
    <div class="absolute -top-16 -left-16 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-20 right-1/3 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 max-w-lg text-center sm:text-left mb-6 sm:mb-0">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest mb-3">
        <span>Cosmic Learning Path</span>
      </div>
      <h2 class="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
        Welcome back, {{ userName || 'Instructor' }} 🚀
      </h2>
      <p class="text-xs sm:text-sm text-slate-300 font-medium mt-3 leading-relaxed">
        You've completed <span class="font-extrabold text-yellow-400 underline decoration-yellow-400 decoration-2">{{ progressPercent || 75 }}%</span> of your course creation milestones this week!
      </p>

      <!-- Progress bar widget -->
      <div class="mt-5 max-w-md">
        <div class="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
          <span>Weekly Target</span>
          <span class="text-yellow-400 font-mono font-bold">{{ progressPercent || 75 }}% Completed</span>
        </div>
        <div class="w-full h-3 bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
          <div
            class="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000 shadow-lg shadow-yellow-500/30"
            :style="{ width: `${progressPercent || 75}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Floating Astronaut Mascot -->
    <div ref="mascotRef" class="relative z-10 shrink-0 sm:-mr-2">
      <div class="w-32 h-32 sm:w-40 sm:h-40 relative">
        <div class="absolute -inset-2 bg-purple-600/30 rounded-full blur-xl -z-10"></div>
        <img src="/images/cosmic_astronaut.png" alt="Cosmic Astronaut" class="w-full h-auto drop-shadow-[0_15px_25px_rgba(124,58,237,0.5)] transform -rotate-12" />
      </div>
    </div>
  </div>
</template>
