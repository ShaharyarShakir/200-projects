<script setup lang="ts">
import type { Course } from '~/types/course'

defineProps<{
  course: Course
}>()

const { academy } = useAcademy()
</script>

<template>
  <div class="bg-[#110d24]/90 border border-purple-900/30 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/40 transition-all duration-300 flex flex-col group">
    <div class="h-48 bg-gradient-to-br from-purple-950/60 to-slate-900 flex items-center justify-center relative overflow-hidden">
      <!-- Ambient card glow -->
      <div class="absolute -top-12 -right-12 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      
      <div
        class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl group-hover:scale-110 group-hover:rotate-3 transition duration-300 shadow-xl shadow-purple-950/80"
        :style="{ backgroundColor: academy?.primaryColor || '#7c3aed' }"
      >
        {{ course.title ? course.title.charAt(0).toUpperCase() : 'C' }}
      </div>
    </div>
    
    <div class="p-6 flex-1 flex flex-col justify-between">
      <div>
        <span class="text-[10px] font-black uppercase tracking-widest text-[#facc15] bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
          Interactive Course
        </span>
        <h3 class="text-lg font-extrabold text-white mt-3 mb-2 group-hover:text-[#facc15] transition-colors duration-200">
          {{ course.title }}
        </h3>
        <p class="text-xs text-slate-300 flex-1 line-clamp-3 leading-relaxed">
          {{ course.description || 'Explore interactive lessons and structured learning paths in this academy.' }}
        </p>
      </div>

      <div class="pt-5 mt-4 border-t border-purple-900/30 flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-400">Enrolling Open</span>
        <NuxtLink :to="`/courses/${course.id}`">
          <button class="px-4 py-2 rounded-full text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-md shadow-yellow-500/20 transition-all duration-200 uppercase">
            View →
          </button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
