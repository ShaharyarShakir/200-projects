<script setup lang="ts">
import { BookOpen, Plus, ArrowRight, Loader2, CheckCircle2, Clock } from 'lucide-vue-next'

definePageMeta({
  layout: 'tenant',
  middleware: 'tenant'
})

interface Course {
  id: string
  title: string
  description: string
  status: string
}

const route = useRoute()
const tenantSlug = route.params.tenantSlug as string
const { canManageCourses } = usePermissions()
const { tenant } = useTenant()

const { fetch: apiFetch } = useApi()

const {
  data: courses,
  pending,
  error
} = await useAsyncData<Course[]>(
  `tenant-courses-${tenantSlug}`,
  () => apiFetch<Course[]>(`/api/tenants/${tenantSlug}/courses`),
  {
    watch: [() => route.params.tenantSlug]
  }
)
</script>

<template>
  <div class="space-y-8 select-none">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-purple-900/40 pb-6">
      <div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-white">Public Courses</h1>
        <p class="text-xs text-slate-400 mt-1">
          Catalog of published courses hosted under <span class="font-semibold text-yellow-400">@{{ tenant?.name || tenantSlug }}</span>
        </p>
      </div>

      <NuxtLink
        v-if="canManageCourses"
        to="/instructor/courses/new"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase cursor-pointer self-start sm:self-auto"
      >
        <Plus class="w-4 h-4 stroke-[3]" />
        <span>Create Course</span>
      </NuxtLink>
    </header>

    <div v-if="pending" class="flex justify-center items-center py-20 bg-[#130f26]/40 border border-purple-900/30 rounded-3xl">
      <Loader2 class="w-8 h-8 text-yellow-400 animate-spin" />
    </div>

    <div v-else-if="error" class="p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-400 text-sm font-medium">
      <span>Failed to load public courses for academy "@{{ tenantSlug }}".</span>
    </div>

    <div v-else-if="!courses || courses.length === 0" class="text-center py-16 bg-[#130f26]/60 border border-purple-900/40 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center space-y-4">
      <div class="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-yellow-400">
        <BookOpen class="w-7 h-7" />
      </div>
      <div class="space-y-1 max-w-sm">
        <h3 class="text-lg font-black text-white uppercase">No Courses Available</h3>
        <p class="text-xs text-slate-400 leading-relaxed">No public courses published yet for this academy.</p>
      </div>
    </div>

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
            {{ course.description || 'No description provided.' }}
          </p>
        </div>

        <div class="pt-4 border-t border-purple-900/30 flex items-center justify-end">
          <NuxtLink
            :to="`/t/${tenantSlug}/courses/${course.id}`"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <span>View Details</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
