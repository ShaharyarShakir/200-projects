<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { Rocket, Sparkles, ArrowRight } from 'lucide-vue-next'

const ctaContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  if (ctaContainer.value && import.meta.client) {
    gsap.to(ctaContainer.value.querySelectorAll('.gsap-float'), {
      y: -12,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }
})
</script>

<template>
  <section ref="ctaContainer" class="py-20 bg-[#0c0919] relative z-20 overflow-hidden select-none">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative overflow-hidden bg-gradient-to-r from-purple-950 via-indigo-900/90 to-[#0c0919] p-8 sm:p-14 rounded-[2.5rem] border border-purple-500/30 shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
        
        <!-- Starfield & Ambient Glows -->
        <div class="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/30 rounded-full blur-[100px] pointer-events-none"></div>

        <!-- Left Content -->
        <div class="space-y-4 text-center lg:text-left z-10 max-w-xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
            <Rocket class="w-3.5 h-3.5" />
            <span>Ready to Launch</span>
          </div>

          <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
            Build Your Branded <br />
            <span class="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Academy Today</span>
          </h2>

          <p class="text-slate-300 text-xs sm:text-base leading-relaxed">
            Launch your branded online academy with your custom domain, HD video streaming, and high-conversion student landing pages.
          </p>

          <div class="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <NuxtLink to="/tenants" class="px-8 py-4 rounded-2xl text-xs sm:text-sm font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/25 hover:scale-105 transition-all uppercase flex items-center gap-2">
              <span>Create Your Academy</span>
              <ArrowRight class="w-4 h-4" />
            </NuxtLink>
            <NuxtLink to="/courses" class="px-8 py-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-all uppercase">
              Explore Catalog
            </NuxtLink>
          </div>
        </div>

        <!-- Right Floating Cosmic Astronaut Graphic -->
        <div class="gsap-float relative z-10 shrink-0">
          <div class="relative w-44 h-44 sm:w-56 sm:h-56">
            <div class="absolute -inset-4 bg-purple-600/30 rounded-full blur-2xl -z-10"></div>
            <img src="/images/cosmic_astronaut.png" alt="Cosmic Astronaut" class="w-full h-auto drop-shadow-[0_20px_40px_rgba(124,58,237,0.6)] transform -rotate-6" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
