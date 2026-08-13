<script setup lang="ts">
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
  <div class="space-y-8">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-300 pb-6">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight">Courses</h1>
        <p class="text-sm text-base-content/70 mt-1">
          Catalog of courses hosted under <span class="font-semibold text-primary">{{ tenant?.name || tenantSlug }}</span>
        </p>
      </div>

      <NuxtLink
        v-if="canManageCourses"
        :to="`/t/${tenantSlug}/courses/new`"
        class="btn btn-primary gap-2 self-start sm:self-auto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Course
      </NuxtLink>
    </header>

    <div v-if="pending" class="flex justify-center items-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="alert alert-error shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Failed to load courses for tenant "{{ tenantSlug }}".</span>
    </div>

    <div v-else-if="!courses || courses.length === 0" class="text-center py-16 bg-base-200/50 rounded-2xl border border-dashed border-base-300">
      <h3 class="text-lg font-medium text-base-content/70">No courses yet.</h3>
      <p class="text-sm text-base-content/50 mt-1">There are no courses listed for this tenant context.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        v-for="course in courses"
        :key="course.id"
        class="card bg-base-200/40 hover:bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
      >
        <div class="card-body">
          <div class="flex items-center justify-between gap-2">
            <h2 class="card-title text-xl font-bold text-base-content line-clamp-1">
              {{ course.title }}
            </h2>
            <span class="badge badge-sm uppercase font-mono" :class="course.status === 'published' ? 'badge-success' : 'badge-ghost'">
              {{ course.status }}
            </span>
          </div>
          <p class="text-sm text-base-content/70 line-clamp-3 mt-2">
            {{ course.description || 'No description provided.' }}
          </p>
        </div>
        <div class="card-actions justify-end p-4 pt-0">
          <NuxtLink
            :to="`/t/${tenantSlug}/courses/${course.id}`"
            class="btn btn-primary btn-sm gap-2"
          >
            View Details
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
