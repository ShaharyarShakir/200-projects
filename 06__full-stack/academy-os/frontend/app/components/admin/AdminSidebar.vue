<script setup lang="ts">
import { gsap } from 'gsap'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Video,
  Palette,
  Globe,
  Settings,
  Building2,
  ShieldCheck,
  ExternalLink
} from 'lucide-vue-next'

const route = useRoute()
const sidebarRef = ref<HTMLElement | null>(null)
const { academy } = useAcademy()
const { user } = useAuth()

const mainNav = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Courses', path: '/admin/courses', icon: BookOpen },
  { name: 'Students', path: '/admin/students', icon: Users },
  { name: 'Media Library', path: '/admin/media', icon: Video },
  { name: 'Branding', path: '/admin/branding', icon: Palette },
  { name: 'Custom Domain', path: '/admin/domain', icon: Globe },
  { name: 'Settings', path: '/admin/settings', icon: Settings }
]

onMounted(() => {
  if (sidebarRef.value) {
    gsap.from(sidebarRef.value.querySelectorAll('.gsap-sidebar-item'), {
      opacity: 0,
      x: -25,
      stagger: 0.05,
      duration: 0.6,
      ease: 'power3.out'
    })
  }
})
</script>

<template>
  <aside ref="sidebarRef" class="w-full md:w-64 bg-[#0c0919]/95 backdrop-blur-xl border-r border-purple-900/40 flex flex-col shrink-0 min-h-screen select-none relative z-20">
    <!-- Logo & Academy Badge -->
    <div class="p-6 border-b border-purple-900/40 gsap-sidebar-item">
      <NuxtLink to="/dashboard" class="flex items-center space-x-3 group">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center font-black text-[#0c0919] text-xl shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
          A
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-lg font-black tracking-tight text-white uppercase truncate group-hover:text-yellow-400 transition-colors">
            {{ academy?.name || 'AcademyOS' }}
          </span>
          <span class="text-[10px] font-bold text-yellow-400 tracking-widest uppercase -mt-0.5 flex items-center gap-1">
            <Building2 class="w-3 h-3 text-yellow-400" />
            <span>@{{ academy?.slug || 'my-academy' }}</span>
          </span>
        </div>
      </NuxtLink>
    </div>

    <!-- Main Navigation (7 Core Shell Sections) -->
    <nav class="flex-1 px-4 py-5 space-y-1.5">
      <div class="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
        Academy Studio
      </div>

      <NuxtLink
        v-for="item in mainNav"
        :key="item.name"
        :to="item.path"
        :class="[
          route.path === item.path || (item.path !== '/dashboard' && route.path.startsWith(item.path))
            ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/50 text-white font-extrabold border border-purple-500/40 shadow-xl shadow-purple-950/50 scale-[1.02]'
            : 'text-slate-400 hover:text-white hover:bg-white/5 font-semibold',
          'gsap-sidebar-item flex items-center justify-between px-4 py-3 rounded-2xl text-xs transition-all duration-200 group'
        ]"
      >
        <div class="flex items-center space-x-3">
          <component
            :is="item.icon"
            class="w-4 h-4"
            :class="(route.path === item.path || (item.path !== '/dashboard' && route.path.startsWith(item.path))) ? 'text-yellow-400' : 'text-slate-400 group-hover:text-yellow-400 transition-colors'"
          />
          <span>{{ item.name }}</span>
        </div>
      </NuxtLink>
    </nav>

    <!-- Public Site Link & Platform Info -->
    <div class="p-4 border-t border-purple-900/40 space-y-2">
      <a
        v-if="academy?.slug"
        :href="`/t/${academy.slug}`"
        target="_blank"
        class="gsap-sidebar-item flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 transition-all"
      >
        <span>View Public Academy</span>
        <ExternalLink class="w-3.5 h-3.5" />
      </a>

      <div class="px-4 py-2 bg-purple-950/30 border border-purple-900/30 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
        <span class="truncate">{{ user?.email }}</span>
        <span class="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[9px] text-emerald-400 font-bold uppercase">1:1 SaaS</span>
      </div>
    </div>
  </aside>
</template>
