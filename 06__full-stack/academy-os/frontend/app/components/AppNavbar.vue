<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'
import { Sun, Moon, Sparkles, BookOpen, GraduationCap, Video, Building2 } from 'lucide-vue-next'
import TenantSwitcher from './TenantSwitcher.vue'

const { theme, toggleTheme } = useTheme()
const { user } = useAuth()
</script>

<template>
  <div class="navbar bg-[#0c0919]/90 backdrop-blur-md sticky top-0 z-50 border-b border-purple-900/40 px-4 lg:px-8 py-3 transition-colors duration-300">
    <div class="navbar-start">
      <div class="dropdown">
        <div tabindex="0" role="button" class="btn btn-ghost lg:hidden text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </div>
        <ul tabindex="0" class="menu menu-sm dropdown-content bg-[#0c0919] rounded-2xl z-50 mt-3 w-52 p-3 shadow-2xl border border-purple-900/40 text-slate-200">
          <li><NuxtLink to="/onboarding" class="font-medium hover:text-yellow-400"><Building2 class="w-4 h-4 text-yellow-400" /> Create Academy</NuxtLink></li>
          <li><NuxtLink to="/courses" class="font-medium hover:text-yellow-400"><BookOpen class="w-4 h-4 text-purple-400" /> Courses</NuxtLink></li>
          <li><NuxtLink to="/instructor/courses" class="font-medium hover:text-yellow-400"><Video class="w-4 h-4 text-amber-400" /> Instructor Studio</NuxtLink></li>
        </ul>
      </div>
      
      <NuxtLink to="/" class="flex items-center space-x-3 group">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center font-black text-[#0c0919] shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
          A
        </div>
        <span class="text-xl font-black tracking-tight text-white uppercase group-hover:text-yellow-400 transition-colors">
          AcademyOS
        </span>
      </NuxtLink>
    </div>

    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1 gap-2 text-sm font-semibold text-slate-300">
        <li><NuxtLink to="/onboarding" class="hover:text-yellow-400 transition-colors gap-2"><Building2 class="w-4 h-4 text-yellow-400" /> Create Academy</NuxtLink></li>
        <li><NuxtLink to="/courses" class="hover:text-yellow-400 transition-colors gap-2"><BookOpen class="w-4 h-4 text-purple-400" /> Course Catalog</NuxtLink></li>
        <li><NuxtLink to="/instructor/courses" class="hover:text-yellow-400 transition-colors gap-2"><Video class="w-4 h-4 text-amber-400" /> Instructor Studio</NuxtLink></li>
      </ul>
    </div>

    <div class="navbar-end gap-3">
      <!-- Tenant Switcher Dropdown -->
      <TenantSwitcher />

      <NuxtLink to="/courses" class="px-5 py-2.5 rounded-full text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all uppercase flex items-center gap-2">
        <GraduationCap class="w-4 h-4" />
        Explore Courses
      </NuxtLink>
    </div>
  </div>
</template>
