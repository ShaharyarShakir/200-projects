<script setup lang="ts">
definePageMeta({
  layout: 'tenant',
  middleware: 'tenant'
})

interface CourseDetail {
  id: string
  title: string
  description?: string
  status?: string
}

const route = useRoute()
const tenantSlug = route.params.tenantSlug as string
const courseId = route.params.courseId as string
const { tenant } = useTenant()

const { fetch: apiFetch } = useApi()

const { data: result, pending, error } = await useAsyncData<{ course: CourseDetail; sections?: any[]; enrolled?: boolean }>(
  `tenant-course-detail-${courseId}`,
  () => {
    if (!courseId || courseId === 'undefined') return Promise.resolve(null)
    return apiFetch(`/api/public/courses/${courseId}`)
  }
)

const course = computed(() => result.value?.course)
</script>

<template>
  <div class="space-y-8">
    <div>
      <NuxtLink :to="`/t/${tenantSlug}/courses`" class="btn btn-ghost btn-sm gap-2 mb-4">
        &larr; Back to Courses
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex justify-center items-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error || !course" class="alert alert-error shadow-lg">
      <span>Course not found in {{ tenant?.name || tenantSlug }}.</span>
    </div>

    <div v-else class="bg-base-200/40 p-8 rounded-3xl border border-base-300 space-y-6">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-3xl font-extrabold tracking-tight text-base-content">
          {{ course.title }}
        </h1>
        <span class="badge badge-primary font-mono uppercase">
          {{ course.status || 'Published' }}
        </span>
      </div>

      <p class="text-base-content/80 text-lg">
        {{ course.description || 'No description available for this course.' }}
      </p>

      <div class="border-t border-base-300 pt-6 flex items-center justify-between text-xs text-base-content/50">
        <span>Course ID: <code class="font-mono">{{ course.id }}</code></span>
        <span>Tenant: <strong class="text-primary font-mono">{{ tenantSlug }}</strong></span>
      </div>
    </div>
  </div>
</template>
