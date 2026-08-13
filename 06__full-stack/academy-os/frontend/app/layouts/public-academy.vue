<script setup lang="ts">
import { BookOpen, GraduationCap, Sparkles, Building2 } from 'lucide-vue-next'

const { publicTenant } = useHostTenant()
const { tenant } = useTenant()

const currentAcademy = computed(() => publicTenant.value || tenant.value)
const primaryColor = computed(() => currentAcademy.value?.primary_color || '#4f46e5')
const academyName = computed(() => currentAcademy.value?.name || 'Academy')
const activeSlug = computed(() => currentAcademy.value?.slug || '')
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content flex flex-col font-sans antialiased">
    <!-- White-label Branded Header -->
    <header class="bg-base-100/90 backdrop-blur-md sticky top-0 z-40 border-b border-base-200 px-6 lg:px-12 py-4 flex items-center justify-between">
      <NuxtLink :to="activeSlug ? `/t/${activeSlug}` : '/'" class="flex items-center gap-3 group">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md transition-transform group-hover:scale-105"
          :style="{ backgroundColor: primaryColor }"
        >
          {{ academyName.charAt(0).toUpperCase() }}
        </div>
        <div>
          <div class="font-black text-xl tracking-tight text-base-content group-hover:text-primary transition-colors">
            {{ academyName }}
          </div>
          <div class="text-[10px] font-mono text-base-content/50 uppercase tracking-widest">
            Online Learning Platform
          </div>
        </div>
      </NuxtLink>

      <nav class="flex items-center gap-6">
        <NuxtLink
          :to="activeSlug ? `/t/${activeSlug}/courses` : '/courses'"
          class="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <BookOpen class="w-4 h-4" />
          Courses
        </NuxtLink>

        <NuxtLink
          to="/admin"
          class="btn btn-sm rounded-xl font-bold text-xs"
          :style="{ backgroundColor: primaryColor, color: '#ffffff' }"
        >
          Instructor Portal
        </NuxtLink>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12">
      <slot />
    </main>

    <!-- White-label Footer -->
    <footer class="bg-base-200/50 border-t border-base-300 py-8 px-6 text-center text-xs text-base-content/60 space-y-2">
      <p class="font-semibold">&copy; {{ new Date().getFullYear() }} {{ academyName }}. All rights reserved.</p>
      <p class="text-[10px] font-mono text-base-content/40">Powered by AcademyOS Infrastructure</p>
    </footer>
  </div>
</template>
