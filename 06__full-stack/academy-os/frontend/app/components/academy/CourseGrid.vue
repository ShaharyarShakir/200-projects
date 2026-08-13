<script setup lang="ts">
import type { Course } from '~/types/course'

defineProps<{
  courses: Course[]
  loading?: boolean
}>()
</script>

<template>
  <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div v-for="i in 3" :key="i" class="h-80 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>
  </div>

  <div v-else-if="courses.length === 0" class="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
    <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 font-bold mb-3">
      ?
    </div>
    <h3 class="text-lg font-semibold text-white">No courses available yet</h3>
    <p class="text-sm text-slate-400 mt-1">Check back soon for new published content!</p>
  </div>

  <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <AcademyCourseCard
      v-for="course in courses"
      :key="course.id"
      :course="course"
    />
  </div>
</template>
