<script setup lang="ts">
import { gsap } from 'gsap'
import { BookOpen, LogOut, Plus, User as UserIcon, Building2, Sparkles, GraduationCap, Video, ShieldCheck, Flame, ArrowUpRight } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const { user, logout, loading } = useAuth()
const { tenant } = useTenant()
const { academies, fetchAcademies } = useAcademies()
const dashboardContainer = ref<HTMLElement | null>(null)

async function handleLogout() {
  await logout()
  await navigateTo('/')
}

onMounted(async () => {
  const userAcademies = await fetchAcademies()
  if (!userAcademies || userAcademies.length === 0) {
    await navigateTo('/onboarding')
    return
  }

  if (dashboardContainer.value) {
    // GSAP Staggered Entrance
    gsap.from(dashboardContainer.value.querySelectorAll('.gsap-card'), {
      opacity: 0,
      y: 35,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out'
    })

    // GSAP Floating Astronaut continuous animation
    gsap.to(dashboardContainer.value.querySelectorAll('.gsap-float'), {
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
  <div ref="dashboardContainer" class="space-y-8 select-none">
    <!-- Cosmic Welcome Banner with Floating Astronaut -->
    <div class="gsap-card relative overflow-hidden bg-gradient-to-r from-purple-950/80 via-indigo-900/50 to-[#0c0919] p-8 md:p-10 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
      
      <!-- Background Starfield Particle Effect -->
      <div class="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div class="absolute -top-24 -left-24 w-80 h-80 bg-purple-600/25 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="space-y-3 z-10 max-w-2xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Cosmic Workspace Active</span>
        </div>
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-tight">
          Welcome back, <span class="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">{{ user?.name || 'Instructor' }}</span>
        </h1>
        <p class="text-slate-300 text-sm md:text-base leading-relaxed">
          Logged in as <span class="px-2 py-0.5 bg-purple-900/40 border border-purple-500/30 rounded text-yellow-400 font-mono font-bold">{{ user?.name || 'Instructor' }}</span>. Your multi-tenant academy is live and ready for course creation.
        </p>

        <div class="pt-4 flex flex-wrap items-center gap-4">
          <NuxtLink to="/instructor/courses" class="px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase flex items-center gap-2">
            <Video class="w-4 h-4" />
            Instructor Studio
          </NuxtLink>

          <button
            :disabled="loading"
            @click="handleLogout"
            class="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-all flex items-center gap-2"
          >
            <LogOut class="w-4 h-4 text-red-400" />
            <span>{{ loading ? 'Logging out...' : 'Log Out' }}</span>
          </button>
        </div>
      </div>

      <!-- Floating Cosmic Astronaut Graphic -->
      <div class="gsap-float relative z-10 shrink-0 self-center lg:self-auto">
        <div class="relative w-36 h-36 sm:w-44 sm:h-44">
          <div class="absolute -inset-4 bg-purple-600/30 rounded-full blur-2xl -z-10"></div>
          <img src="/images/cosmic_astronaut.png" alt="Cosmic Astronaut" class="w-full h-auto drop-shadow-[0_20px_30px_rgba(124,58,237,0.6)] transform -rotate-6" />
        </div>
      </div>
    </div>

    <!-- Quick Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md hover:border-purple-500/50 transition-all duration-300 group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Courses</span>
          <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <BookOpen class="w-5 h-5" />
          </div>
        </div>
        <p class="text-3xl font-black text-white mt-4">12</p>
        <span class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
          <Flame class="w-3.5 h-3.5" /> +3 published this month
        </span>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md hover:border-purple-500/50 transition-all duration-300 group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Active Students</span>
          <div class="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
            <GraduationCap class="w-5 h-5" />
          </div>
        </div>
        <p class="text-3xl font-black text-white mt-4">1,480</p>
        <span class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
          <ArrowUpRight class="w-3.5 h-3.5" /> +18.4% growth
        </span>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md hover:border-purple-500/50 transition-all duration-300 group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Tenant Status</span>
          <div class="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <Building2 class="w-5 h-5" />
          </div>
        </div>
        <p class="text-lg font-bold text-white mt-4 truncate">{{ tenant?.name || 'Local Master Tenant' }}</p>
        <span class="text-[11px] text-cyan-300 font-mono font-semibold block mt-1">
          slug: {{ tenant?.slug || 'localhost' }}
        </span>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 rounded-2xl shadow-xl backdrop-blur-md hover:border-purple-500/50 transition-all duration-300 group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Session Security</span>
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <ShieldCheck class="w-5 h-5" />
          </div>
        </div>
        <p class="text-lg font-bold text-emerald-400 mt-4">HttpOnly Cookie</p>
        <span class="text-[11px] text-slate-400 font-semibold block mt-1">
          Opaque DB Token Validated
        </span>
      </div>
    </div>

    <!-- Main Studio Action Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 sm:p-8 rounded-3xl shadow-xl backdrop-blur-md space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-black text-xl text-white uppercase tracking-tight">Academy Tenant Isolation</h3>
            <p class="text-xs text-slate-400">Scoped data access and custom branding</p>
          </div>
        </div>

        <div v-if="tenant" class="p-4 bg-purple-950/40 border border-purple-900/50 rounded-2xl space-y-2 text-sm text-slate-300 font-medium">
          <p><span class="text-slate-400 font-semibold">Tenant Name:</span> <strong class="text-white">{{ tenant.name }}</strong></p>
          <p><span class="text-slate-400 font-semibold">Hostname Slug:</span> <code class="px-2 py-0.5 bg-slate-900 border border-purple-900/60 rounded text-yellow-400 text-xs font-mono">{{ tenant.slug }}</code></p>
        </div>
        <div v-else class="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400 italic">
          No custom tenant selected yet. Accessing under default academy scoping.
        </div>

        <div class="pt-2 flex gap-3">
          <NuxtLink to="/onboarding" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30">
            Create New Academy
          </NuxtLink>
        </div>
      </div>

      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-6 sm:p-8 rounded-3xl shadow-xl backdrop-blur-md space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-black text-xl text-white uppercase tracking-tight">Quick Actions</h3>
            <p class="text-xs text-slate-400">Manage courses, section assets and custom domain</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 pt-2">
          <NuxtLink to="/courses" class="px-5 py-3 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all uppercase">
            Browse All Courses
          </NuxtLink>
          <NuxtLink to="/instructor/courses" class="px-5 py-3 rounded-2xl text-xs font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-all uppercase">
            Create New Course
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
