<script setup lang="ts">
import { Plus, Video, BookOpen, ExternalLink, RefreshCw } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { academy } = useAcademy()
const { canManageCourses } = usePermissions()
const { fetch: apiFetch } = useApi()

interface Course {
  id: string
  title: string
  description?: string
  status?: string
}

const { data: rawData, pending, refresh } = await useAsyncData(
  'admin-courses-list',
  () => apiFetch<any>('/api/courses')
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
  <div class="space-y-8 select-none">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-6">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-white uppercase">Course Studio</h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Manage and publish educational content for <span class="font-bold text-yellow-400">{{ academy?.name || 'your academy' }}</span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="() => refresh()"
          class="px-4 py-2.5 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 rounded-2xl text-xs font-bold text-purple-200 transition-all flex items-center gap-2"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': pending }" />
          <span>Refresh</span>
        </button>

        <NuxtLink
          v-if="canManageCourses"
          to="/instructor/courses/new"
          class="px-6 py-3 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          <span>Create New Course</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-20">
      <div class="p-4 bg-purple-950/60 border border-purple-800/40 rounded-full text-yellow-400">
        <RefreshCw class="w-8 h-8 animate-spin" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!courses.length" class="text-center py-16 bg-[#0c0919]/90 rounded-3xl border border-dashed border-purple-900/50 space-y-4 shadow-xl">
      <BookOpen class="w-12 h-12 text-purple-400/40 mx-auto" />
      <div>
        <h3 class="text-lg font-black text-white uppercase">No Courses Found</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">Start by creating your first course with sections, lessons, and HLS video streaming.</p>
      </div>
      <NuxtLink to="/instructor/courses/new" class="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-[#0c0919] font-black text-xs uppercase rounded-2xl inline-flex items-center gap-2 shadow-lg">
        <Plus class="w-4 h-4" />
        Create Course Now
      </NuxtLink>
    </div>

    <!-- Courses Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="course in courses"
        :key="course.id"
        class="bg-[#0c0919]/90 border border-purple-900/40 hover:border-purple-500/50 shadow-xl transition-all rounded-3xl p-6 flex flex-col justify-between space-y-4"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span
              class="px-2.5 py-1 rounded-full font-mono uppercase text-[10px] font-bold border"
              :class="course.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'"
            >
              {{ course.status || 'draft' }}
            </span>
            <span class="text-[10px] font-mono text-slate-500">ID: {{ course.id.substring(0, 8) }}...</span>
          </div>

          <h3 class="text-lg font-black text-white line-clamp-1">{{ course.title }}</h3>
          <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed">{{ course.description || 'No description provided.' }}</p>
        </div>

        <div class="pt-4 border-t border-purple-900/30 flex items-center justify-between gap-2">
          <NuxtLink :to="`/instructor/courses/${course.id}`" class="text-xs font-bold text-yellow-400 hover:text-yellow-300">
            Edit & Video Studio
          </NuxtLink>
          <a v-if="academy?.slug" :href="`/t/${academy.slug}/courses/${course.id}`" target="_blank" class="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1">
            <ExternalLink class="w-3 h-3" />
            <span>Preview</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
