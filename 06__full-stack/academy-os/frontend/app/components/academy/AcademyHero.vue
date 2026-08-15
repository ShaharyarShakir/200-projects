<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'

const { academy } = useAcademy()
const heroSection = ref<HTMLElement | null>(null)
const mouseParallax = ref({ x: 0, y: 0 })

function onMouseMove(e: MouseEvent) {
  if (!heroSection.value) return
  const rect = heroSection.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left - rect.width / 2
  const mouseY = e.clientY - rect.top - rect.height / 2

  mouseParallax.value = {
    x: mouseX / 35,
    y: mouseY / 35
  }
}

onMounted(async () => {
  if (!import.meta.client || !heroSection.value) return
  await nextTick()

  const title = heroSection.value.querySelector('.gsap-hero-title')
  const sub = heroSection.value.querySelector('.gsap-hero-sub')
  const btns = Array.from(heroSection.value.querySelectorAll('.gsap-hero-btn'))
  const stage = heroSection.value.querySelector('.gsap-hero-stage')

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  if (title) {
    tl.fromTo(title, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 })
  }
  if (sub) {
    tl.fromTo(sub, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.6')
  }
  if (btns.length > 0) {
    tl.fromTo(btns, { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.6 }, '-=0.4')
  }
  if (stage) {
    tl.fromTo(stage, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.2)' }, '-=0.5')
  }

  // Continuous floating astronaut loop
  const floaters = Array.from(heroSection.value.querySelectorAll('.gsap-astronaut-float'))
  if (floaters.length > 0) {
    gsap.to(floaters, {
      y: -16,
      rotate: -4,
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }

  // Continuous planet pulse loop
  const pulsers = Array.from(heroSection.value.querySelectorAll('.gsap-planet-pulse'))
  if (pulsers.length > 0) {
    gsap.to(pulsers, {
      scale: 1.06,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }
})
</script>

<template>
  <section
    ref="heroSection"
    @mousemove="onMouseMove"
    class="relative bg-[#0c0919] overflow-hidden pt-12 md:pt-20 pb-40 text-white select-none"
  >
    <!-- Starfield particles background -->
    <div class="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]"></div>

    <!-- Background glow halos -->
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
      <!-- Main Upper Title -->
      <h1 class="gsap-hero-title text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.08] max-w-5xl mx-auto drop-shadow-md">
        DO WHAT YOU DO BEST,<br />
        WE'LL HANDLE THE REST
      </h1>

      <!-- Subtitle -->
      <p class="gsap-hero-sub mt-4 sm:mt-6 text-xs sm:text-sm md:text-base text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
        We specialize in designing, hosting, and scaling world-class interactive online academies with custom branding and HD video streaming.
      </p>

      <!-- CTA Buttons -->
      <div class="mt-8 flex items-center justify-center space-x-4 relative z-30">
        <NuxtLink to="/courses" class="gsap-hero-btn px-7 py-3 rounded-full text-xs sm:text-sm font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/25 hover:scale-105 transition-all duration-300 uppercase">
          Explore Courses
        </NuxtLink>
        <NuxtLink to="/onboarding" class="gsap-hero-btn px-7 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-all duration-300 uppercase">
          Create Your Academy
        </NuxtLink>
      </div>

      <!-- Floating Visual Stage Canvas with Parallax Mouse Movement -->
      <div class="gsap-hero-stage relative w-full max-w-5xl mx-auto h-[380px] sm:h-[460px] mt-8 pointer-events-none">
        
        <!-- Left Cyan/Blue Planet with Purple Backdrop Aura -->
        <div
          class="gsap-planet-pulse absolute top-4 left-4 sm:left-12 w-28 sm:w-36 h-28 sm:h-36 transition-transform duration-300 ease-out"
          :style="{ transform: `translate(${mouseParallax.x * -0.5}px, ${mouseParallax.y * -0.5}px)` }"
        >
          <div class="w-full h-full rounded-full bg-gradient-to-tr from-cyan-600 to-blue-400 p-1 shadow-2xl shadow-cyan-500/40 relative flex items-center justify-center">
            <div class="w-full h-full rounded-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-300 via-blue-500 to-indigo-950 opacity-90"></div>
            <!-- Purple aura blob background -->
            <div class="absolute -inset-4 bg-purple-600/30 rounded-full blur-xl -z-10"></div>
          </div>
        </div>

        <!-- Center Clutch Badge Blob -->
        <div
          class="absolute top-6 left-1/2 -translate-x-1/2 sm:top-8 w-44 sm:w-56 p-4 bg-indigo-900/40 border border-indigo-500/30 backdrop-blur-md rounded-[3rem] shadow-2xl shadow-purple-900/40 flex flex-col items-center justify-center text-center transition-transform duration-300 ease-out"
          :style="{ transform: `translate(-50%, ${mouseParallax.y * 0.3}px)` }"
        >
          <div class="w-20 sm:w-24 h-20 sm:h-24 rounded-full border-4 border-cyan-400/80 bg-slate-900 flex flex-col items-center justify-center p-2 shadow-inner">
            <span class="text-[9px] font-bold tracking-widest text-slate-300 uppercase">CLIENTS SAY</span>
            <span class="text-[10px] font-black tracking-tight text-white leading-tight uppercase">WE DELIVER ON</span>
            <span class="text-xs font-black text-cyan-400 uppercase mt-0.5">Clutch</span>
          </div>
        </div>

        <!-- Right Astronaut Floating with Purple Planet -->
        <div
          class="gsap-astronaut-float absolute top-2 right-4 sm:right-12 w-32 sm:w-44 h-32 sm:h-44 transition-transform duration-300 ease-out"
          :style="{ transform: `translate(${mouseParallax.x * 0.8}px, ${mouseParallax.y * 0.8}px)` }"
        >
          <div class="relative w-full h-full">
            <img src="/images/cosmic_astronaut.png" alt="Cosmic Astronaut" class="w-28 sm:w-36 h-auto drop-shadow-[0_15px_25px_rgba(124,58,237,0.6)] transform -rotate-12" />
          </div>
        </div>

        <!-- Speech Bubble: "OMG! HOW IS THAT POSSIBLE?" -->
        <div
          class="gsap-astronaut-float absolute bottom-28 right-8 sm:right-24 bg-gradient-to-r from-purple-800 to-indigo-900 border border-purple-400/40 text-white px-5 py-3.5 rounded-3xl shadow-2xl shadow-indigo-950/80 transform rotate-6 transition-transform duration-300 ease-out"
          :style="{ transform: `translate(${mouseParallax.x * 0.6}px, ${mouseParallax.y * 0.6}px)` }"
        >
          <span class="block text-sm sm:text-base font-black tracking-wide uppercase">OMG!</span>
          <span class="block text-[11px] sm:text-xs font-semibold text-purple-200 uppercase mt-0.5">HOW IS THAT POSSIBLE?</span>
          <!-- Speech bubble tail -->
          <div class="absolute -bottom-2 left-6 w-4 h-4 bg-indigo-900 rotate-45 border-r border-b border-purple-400/40"></div>
        </div>

        <!-- Center Bottom Pink Crater Planet -->
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 sm:w-88 md:w-[420px] z-20 drop-shadow-[0_20px_40px_rgba(219,39,119,0.4)]">
          <img src="/images/cosmic_pink_planet.png" alt="Cosmic Pink Planet" class="w-full h-auto transform hover:scale-105 transition-transform duration-500" />
        </div>

        <!-- Small Ringed Planet bottom right -->
        <div class="absolute bottom-4 right-16 sm:right-36 w-20 sm:w-28 z-30">
          <div class="relative flex flex-col items-center">
            <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-300 border border-cyan-200/40 shadow-lg shadow-cyan-500/50 relative">
              <div class="absolute inset-0 rounded-full border-2 border-white/30 transform scale-125 -rotate-45"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fluid Purple Bottom Wave Graphics -->
    <div class="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10">
      <svg class="relative block w-full h-24 sm:h-36 md:h-48" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,60 L1200,120 L0,120 Z" fill="#4c1d95" opacity="0.6"></path>
        <path d="M0,20 C200,110 450,10 650,70 C850,130 1050,30 1200,80 L1200,120 L0,120 Z" fill="#6d28d9" opacity="0.8"></path>
        <path d="M0,40 C300,120 600,20 800,90 C1000,140 1100,50 1200,95 L1200,120 L0,120 Z" fill="#7c3aed"></path>
      </svg>
    </div>
  </section>
</template>
