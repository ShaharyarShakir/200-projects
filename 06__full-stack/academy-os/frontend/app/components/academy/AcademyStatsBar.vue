<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Users, GraduationCap, Video, Globe, Zap, ShieldCheck } from 'lucide-vue-next'

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger)
}

const statsContainer = ref<HTMLElement | null>(null)

const stats = [
  { label: 'Active Students', value: 52400, suffix: '+', icon: Users, color: 'text-[#facc15]', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  { label: 'Stream Uptime', value: 99.9, suffix: '%', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { label: 'Courses Published', value: 850, suffix: '+', icon: Video, color: 'text-purple-400', bg: 'bg-purple-600/10 border-purple-500/30' },
  { label: 'Global Academies', value: 120, suffix: '+', icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
]

onMounted(() => {
  if (statsContainer.value && import.meta.client) {
    const cards = statsContainer.value.querySelectorAll('.gsap-stat-card')
    
    gsap.from(cards, {
      opacity: 0,
      y: 40,
      scale: 0.9,
      duration: 0.8,
      stagger: 0.12,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: statsContainer.value,
        start: 'top 85%'
      }
    })

    // Continuous floating animation
    gsap.to(cards, {
      y: -8,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.2
    })
  }
})
</script>

<template>
  <section ref="statsContainer" class="py-12 bg-[#0c0919] relative z-30 select-none">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="gsap-stat-card p-6 bg-[#0c0919]/90 border border-purple-900/40 hover:border-purple-500/60 rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 group flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform duration-300" :class="stat.bg">
              <component :is="stat.icon" class="w-6 h-6" :class="stat.color" />
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-950/60 border border-purple-900/50 text-slate-400">
              Verified
            </span>
          </div>

          <div class="mt-6">
            <div class="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>{{ stat.value }}</span>
              <span :class="stat.color">{{ stat.suffix }}</span>
            </div>
            <p class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-400 mt-1">
              {{ stat.label }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
