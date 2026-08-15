<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import type { Course } from '~/types/course'
import { Plus, BookOpen, Sparkles, Video, ArrowRight, Loader2, CheckCircle2, Clock, RefreshCw } from 'lucide-vue-next'

const api = useApi()
const { data: rawData, refresh, pending } = await useAsyncData(
  'instructor-courses-list',
  () => api.request<any>('/api/courses')
)

const courses = computed<Course[]>(() => {
  const val = rawData.value
  if (!val) return []
  if (Array.isArray(val)) return val
  if (Array.isArray(val.courses)) return val.courses
  return []
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#130f26]/80 border border-purple-900/40 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Instructor Studio</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3 mt-2">
          <Video class="w-7 h-7 text-yellow-400" />
          <span>My Courses</span>
        </h1>
        <p class="text-slate-400 text-xs sm:text-sm">Manage, edit structure, and publish your academy course catalog</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="() => refresh()"
          class="px-4 py-3 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 rounded-2xl text-xs font-bold text-purple-200 transition-all flex items-center gap-2"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': pending }" />
          <span>Refresh</span>
        </button>

        <NuxtLink
          to="/instructor/courses/new"
          class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase tracking-wider shrink-0 cursor-pointer"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          <span>Create Course</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex flex-col items-center justify-center py-20 bg-[#130f26]/60 border border-purple-900/30 rounded-3xl backdrop-blur-md">
      <Loader2 class="w-10 h-10 text-yellow-400 animate-spin mb-4" />
      <p class="text-slate-300 text-sm font-medium">Loading instructor courses...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!courses.length" class="relative overflow-hidden bg-[#130f26]/80 border border-purple-900/40 p-10 sm:p-14 rounded-3xl text-center backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center space-y-6">
      <div class="absolute -top-24 -left-24 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div class="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-yellow-400 shadow-inner">
        <BookOpen class="w-8 h-8" />
      </div>

      <div class="space-y-2 max-w-md">
        <h3 class="text-xl font-black text-white uppercase tracking-tight">No Courses Created Yet</h3>
        <p class="text-slate-400 text-sm leading-relaxed">
          You haven't created any courses yet. Get started by creating your first course to share your knowledge.
        </p>
      </div>

      <NuxtLink
        to="/instructor/courses/new"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all uppercase tracking-wider cursor-pointer"
      >
        <Plus class="w-4 h-4 stroke-[3]" />
        <span>Create Your First Course</span>
      </NuxtLink>
    </div>

    <!-- Courses Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        v-for="course in courses"
        :key="course.id"
        class="bg-[#0c0919]/90 border border-purple-900/40 hover:border-purple-500/60 p-6 rounded-3xl shadow-xl backdrop-blur-md hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300 flex flex-col justify-between group space-y-5"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border"
              :class="course.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'"
            >
              <CheckCircle2 v-if="course.status === 'published'" class="w-3.5 h-3.5" />
              <Clock v-else class="w-3.5 h-3.5" />
              {{ course.status }}
            </span>
          </div>

          <h2 class="text-lg font-black text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
            {{ course.title }}
          </h2>

          <p class="text-slate-400 text-xs line-clamp-3 leading-relaxed">
            {{ course.description || 'No description provided for this course yet.' }}
          </p>
        </div>

        <div class="pt-4 border-t border-purple-900/30 flex items-center justify-between">
          <span class="text-[11px] text-slate-500 font-mono font-medium">
            ID: {{ course.id.substring(0, 8) }}...
          </span>
          <NuxtLink
            :to="`/instructor/courses/${course.id}`"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors group-hover:translate-x-1 duration-200"
          >
            <span>Edit Structure</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
