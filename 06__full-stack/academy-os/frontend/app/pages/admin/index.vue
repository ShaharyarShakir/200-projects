<script setup lang="ts">
import { gsap } from 'gsap'
import { BookOpen, Users, Video, Globe, Palette, ArrowUpRight, Plus, Building2, Sparkles, Flame, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { tenant, membership } = useTenant()
const activeSlug = computed(() => tenant.value?.slug || '')
const adminContainer = ref<HTMLElement | null>(null)

interface Course {
  id: string
  title: string
  status: string
}

const { fetch: apiFetch } = useApi()

const { data: courses } = await useAsyncData<Course[]>(
  `admin-dashboard-courses-${activeSlug.value}`,
  () => (activeSlug.value ? apiFetch<Course[]>(`/api/tenants/${activeSlug.value}/courses`) : Promise.resolve([])),
  { watch: [activeSlug] }
)

onMounted(() => {
  if (adminContainer.value) {
    gsap.from(adminContainer.value.querySelectorAll('.gsap-card'), {
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out'
    })

    gsap.to(adminContainer.value.querySelectorAll('.gsap-float'), {
      y: -10,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }
})
</script>

<template>
  <div ref="adminContainer" class="space-y-8 select-none">
    <!-- Welcome Banner with Floating Astronaut Mascot -->
    <div class="gsap-card relative overflow-hidden bg-gradient-to-r from-purple-950/80 via-indigo-900/50 to-[#0c0919] p-8 md:p-10 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      
      <div class="space-y-3 z-10 max-w-2xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
          <Building2 class="w-3.5 h-3.5" />
          <span>Management Console Active</span>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-white uppercase leading-tight">
          Welcome to <span class="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">{{ tenant?.name || 'Your Academy' }}</span>
        </h1>
        <p class="text-slate-300 text-sm max-w-xl">
          Manage your branded online platform, publish courses, configure custom domains, and monitor student progress.
        </p>

        <div class="pt-3 flex items-center gap-3">
          <NuxtLink to="/admin/courses" class="px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase flex items-center gap-2">
            <Plus class="w-4 h-4" />
            Create Course
          </NuxtLink>

          <a
            v-if="activeSlug"
            :href="`/t/${activeSlug}`"
            target="_blank"
            class="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-all flex items-center gap-2"
          >
            <span>View Public Site</span>
            <ArrowUpRight class="w-4 h-4 text-yellow-400" />
          </a>
        </div>
      </div>

      <!-- Floating Astronaut Graphic -->
      <div class="gsap-float relative z-10 shrink-0 self-center md:self-auto">
        <div class="w-32 h-32 sm:w-40 sm:h-40 relative">
          <div class="absolute -inset-2 bg-purple-600/30 rounded-full blur-xl -z-10"></div>
          <img src="/images/cosmic_astronaut.png" alt="Cosmic Astronaut" class="w-full h-auto drop-shadow-[0_15px_25px_rgba(124,58,237,0.5)] transform -rotate-6" />
        </div>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md hover:border-purple-500/50 transition-all duration-300 group space-y-3">
        <div class="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
          <BookOpen class="w-5 h-5" />
        </div>
        <div>
          <div class="text-3xl font-black text-white">{{ courses?.length || 0 }}</div>
          <div class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Total Courses</div>
        </div>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md hover:border-purple-500/50 transition-all duration-300 group space-y-3">
        <div class="w-10 h-10 rounded-xl bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
          <Users class="w-5 h-5" />
        </div>
        <div>
          <div class="text-3xl font-black text-white">1</div>
          <div class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Active Instructors</div>
        </div>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md hover:border-purple-500/50 transition-all duration-300 group space-y-3">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
          <Globe class="w-5 h-5" />
        </div>
        <div>
          <div class="text-sm font-mono font-bold text-cyan-300 truncate">@{{ activeSlug || 'localhost' }}</div>
          <div class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Platform Host</div>
        </div>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md hover:border-purple-500/50 transition-all duration-300 group space-y-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
          <Palette class="w-5 h-5" />
        </div>
        <div>
          <div class="text-sm font-bold text-emerald-400 capitalize">{{ membership?.role || 'Owner' }}</div>
          <div class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Tenant Role</div>
        </div>
      </div>
    </div>

    <!-- Management Quick Access Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <NuxtLink to="/admin/courses" class="gsap-card bg-[#0c0919]/90 hover:bg-purple-950/40 p-6 rounded-3xl border border-purple-900/40 hover:border-purple-500/60 shadow-xl backdrop-blur-md transition-all group space-y-3">
        <BookOpen class="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
        <h3 class="font-black text-lg text-white uppercase group-hover:text-yellow-400 transition-colors">Course Studio</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Create, edit, outline lessons, and publish courses to your academy.</p>
      </NuxtLink>

      <NuxtLink to="/admin/branding" class="gsap-card bg-[#0c0919]/90 hover:bg-purple-950/40 p-6 rounded-3xl border border-purple-900/40 hover:border-purple-500/60 shadow-xl backdrop-blur-md transition-all group space-y-3">
        <Palette class="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
        <h3 class="font-black text-lg text-white uppercase group-hover:text-yellow-400 transition-colors">Branding Customizer</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Customize logo, primary theme colors, hero titles, and academy aesthetics.</p>
      </NuxtLink>

      <NuxtLink to="/admin/domain" class="gsap-card bg-[#0c0919]/90 hover:bg-purple-950/40 p-6 rounded-3xl border border-purple-900/40 hover:border-purple-500/60 shadow-xl backdrop-blur-md transition-all group space-y-3">
        <Globe class="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
        <h3 class="font-black text-lg text-white uppercase group-hover:text-yellow-400 transition-colors">Custom Domain</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Connect your custom web domain (e.g. learn.yourdomain.com) with SSL.</p>
      </NuxtLink>
    </div>
  </div>
</template>
