<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ShieldCheck, Video, Building2, Palette, Zap, Globe, Sparkles, GraduationCap, BookOpen, Layers } from 'lucide-vue-next'

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger)
}

const featuresContainer = ref<HTMLElement | null>(null)

const features = [
  {
    title: 'Custom Branded Domains',
    description: 'Host your online academy on your own custom web domain with custom logos, colors, and headers.',
    icon: Globe,
    badge: 'White-Label',
    color: 'from-purple-500 to-indigo-600',
    iconColor: 'text-purple-400',
    actionText: 'Explore Branding'
  },
  {
    title: 'Buffer-Free HD Video',
    description: 'Upload video lessons effortlessly with automatic mobile-optimized adaptive HD streaming.',
    icon: Video,
    badge: 'HD Streaming',
    color: 'from-yellow-400 to-amber-500',
    iconColor: 'text-yellow-400',
    actionText: 'Video Player Info'
  },
  {
    title: 'Secure Student Login',
    description: 'Instant student onboarding, encrypted account protection, and automated enrollment access.',
    icon: ShieldCheck,
    badge: 'Data Protection',
    color: 'from-emerald-400 to-teal-600',
    iconColor: 'text-emerald-400',
    actionText: 'Security Features'
  },
  {
    title: 'Cosmic Studio Aesthetic',
    description: 'Stunning space dark modes and modern design templates that wow your students at first glance.',
    icon: Palette,
    badge: 'Theme Customizer',
    color: 'from-cyan-400 to-blue-600',
    iconColor: 'text-cyan-400',
    actionText: 'Preview Themes'
  },
  {
    title: 'Student Growth Hub',
    description: 'Interactive lesson schedules, automated homework progress trackers, and live activity calendars.',
    icon: GraduationCap,
    badge: 'Student Tools',
    color: 'from-pink-500 to-rose-600',
    iconColor: 'text-pink-400',
    actionText: 'View Student Hub'
  },
  {
    title: 'Course Creation Studio',
    description: 'Structure course outlines, upload video modules, track enrollment analytics, and publish instantly.',
    icon: BookOpen,
    badge: 'Instructor Studio',
    color: 'from-indigo-400 to-purple-600',
    iconColor: 'text-indigo-400',
    actionText: 'Open Course Studio'
  }
]

function handleMouseMove(e: MouseEvent, card: HTMLElement) {
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  const rotateX = (y - centerY) / -12
  const rotateY = (x - centerX) / 12

  gsap.to(card, {
    rotateX: rotateX,
    rotateY: rotateY,
    transformPerspective: 1000,
    ease: 'power1.out',
    duration: 0.3
  })
}

function handleMouseLeave(card: HTMLElement) {
  gsap.to(card, {
    rotateX: 0,
    rotateY: 0,
    ease: 'power2.out',
    duration: 0.5
  })
}

onMounted(async () => {
  if (!import.meta.client || !featuresContainer.value) return
  await nextTick()

  const cards = Array.from(featuresContainer.value.querySelectorAll('.gsap-feature-card'))
  if (cards.length > 0) {
    gsap.fromTo(cards, 
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: featuresContainer.value,
          start: 'top 80%'
        }
      }
    )
  }
})
</script>

<template>
  <section ref="featuresContainer" class="py-20 bg-[#0c0919] relative z-20 overflow-hidden select-none">
    <!-- Ambient Blur Glows -->
    <div class="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-950/60 border border-purple-500/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
          <Sparkles class="w-3.5 h-3.5" />
          <span>All-In-One Academy Features</span>
        </div>

        <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
          Everything You Need To <span class="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Grow Your Academy</span>
        </h2>

        <p class="text-slate-300 text-xs sm:text-base leading-relaxed font-medium">
          AcademyOS provides everything course creators, educators, and instructors need to teach students, stream video masterclasses, and manage custom branded academies.
        </p>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div
          v-for="feat in features"
          :key="feat.title"
          @mousemove="(e) => handleMouseMove(e, $event.currentTarget as HTMLElement)"
          @mouseleave="handleMouseLeave($event.currentTarget as HTMLElement)"
          class="gsap-feature-card group relative p-8 bg-[#0c0919]/90 border border-purple-900/40 hover:border-purple-500/60 rounded-3xl shadow-2xl backdrop-blur-xl transition-colors duration-300 flex flex-col justify-between"
        >
          <!-- Hover Ambient Glow -->
          <div class="absolute -inset-0.5 rounded-3xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" :class="feat.color"></div>

          <div>
            <!-- Header Row -->
            <div class="flex items-center justify-between mb-6">
              <div class="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-900/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <component :is="feat.icon" class="w-7 h-7" :class="feat.iconColor" />
              </div>

              <span class="px-3 py-1 bg-purple-950/80 border border-purple-900/60 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-300">
                {{ feat.badge }}
              </span>
            </div>

            <!-- Title & Body -->
            <h3 class="text-xl font-black text-white uppercase tracking-tight group-hover:text-yellow-400 transition-colors">
              {{ feat.title }}
            </h3>

            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed mt-3 font-medium">
              {{ feat.description }}
            </p>
          </div>

          <div class="mt-8 pt-4 border-t border-purple-900/30 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
            <span>{{ feat.actionText }}</span>
            <span class="text-yellow-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
