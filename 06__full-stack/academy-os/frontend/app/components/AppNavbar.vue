<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'
import { Sun, Moon, Sparkles, BookOpen, GraduationCap, Video } from 'lucide-vue-next'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <div class="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-base-300 px-4 lg:px-8 transition-colors duration-300">
    <div class="navbar-start">
      <div class="dropdown">
        <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </div>
        <ul tabindex="0" class="menu menu-sm dropdown-content bg-base-200 rounded-box z-1 mt-3 w-52 p-2 shadow-lg border border-base-300">
          <li><NuxtLink to="/courses" class="font-medium"><BookOpen class="w-4 h-4 text-primary" /> Courses</NuxtLink></li>
          <li><NuxtLink to="/instructor/courses" class="font-medium"><Video class="w-4 h-4 text-secondary" /> Instructor Studio</NuxtLink></li>
        </ul>
      </div>
      
      <NuxtLink to="/" class="btn btn-ghost text-xl font-bold gap-2 normal-case text-base-content hover:bg-transparent">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-primary-content font-black shadow-md shadow-primary/20">
          A
        </div>
        <span class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-extrabold tracking-tight">
          AcademyOS
        </span>
      </NuxtLink>
    </div>

    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1 gap-1">
        <li><NuxtLink to="/courses" class="font-medium hover:text-primary transition-colors"><BookOpen class="w-4 h-4" /> Course Catalog</NuxtLink></li>
        <li><NuxtLink to="/instructor/courses" class="font-medium hover:text-secondary transition-colors"><Video class="w-4 h-4" /> Instructor Studio</NuxtLink></li>
      </ul>
    </div>

    <div class="navbar-end gap-3">
      <!-- Dark / Light Theme Toggle -->
      <button
        @click="toggleTheme"
        class="btn btn-circle btn-ghost btn-sm text-base-content hover:bg-base-200 transition-all duration-300"
        :title="theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <Sun v-if="theme === 'dark'" class="w-5 h-5 text-warning transition-transform duration-300 rotate-0 hover:rotate-45" />
        <Moon v-else class="w-5 h-5 text-primary transition-transform duration-300 rotate-0 hover:-rotate-12" />
      </button>

      <NuxtLink to="/courses" class="btn btn-primary btn-sm md:btn-md gap-2 font-semibold shadow-lg shadow-primary/25 rounded-xl hover:scale-105 transition-all">
        <GraduationCap class="w-4 h-4" />
        Explore Courses
      </NuxtLink>
    </div>
  </div>
</template>
