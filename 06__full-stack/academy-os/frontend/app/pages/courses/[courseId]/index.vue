<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, navigateTo } from '#imports'
import { useApi } from '~/composables/useApi'
import { ArrowLeft, BookOpen, CheckCircle, GraduationCap, PlayCircle, Lock, Video } from 'lucide-vue-next'

interface LessonOutline {
  id: string
  title: string
  position: number
}

interface SectionOutline {
  id: string
  title: string
  position: number
  lessons: LessonOutline[]
}

interface CourseData {
  course: {
    id: string
    title: string
    description: string
    status: string
  }
  sections: SectionOutline[]
  enrolled: boolean
}

const route = useRoute()
const api = useApi()
const courseId = route.params.courseId as string

const enrolling = ref(false)
const enrollError = ref('')

const { data: courseData, pending, error } = await useAsyncData<CourseData>(
  `public-course-${courseId}`,
  () => {
    if (!courseId || courseId === 'undefined') return Promise.resolve(null)
    return api.fetch(`/api/public/courses/${courseId}`)
  }
)

async function handleEnroll() {
  enrolling.value = true
  enrollError.value = ''

  try {
    const res: any = await api.fetch(`/api/courses/${courseId}/enroll`, {
      method: 'POST'
    })

    if (res.enrolled) {
      const firstLesson = courseData.value?.sections?.[0]?.lessons?.[0]
      if (firstLesson) {
        await navigateTo(`/learn/${courseId}/${firstLesson.id}`)
      } else {
        await navigateTo(`/courses/${courseId}`)
      }
    }
  } catch (err: any) {
    if (err.status === 401) {
      enrollError.value = 'Please log in to enroll in this course.'
    } else {
      enrollError.value = err.data?.message || 'Failed to enroll in course.'
    }
  } finally {
    enrolling.value = false
  }
}

function startLearning() {
  const firstLesson = courseData.value?.sections?.[0]?.lessons?.[0]
  if (firstLesson) {
    navigateTo(`/learn/${courseId}/${firstLesson.id}`)
  }
}
</script>

<template>
  <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-[80vh]">
    <NuxtLink to="/courses" class="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-base-content mb-6">
      <ArrowLeft class="w-4 h-4" />
      Back to Catalog
    </NuxtLink>

    <div v-if="pending" class="flex flex-col items-center justify-center py-20 gap-3">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="text-base-content/60 text-sm font-medium">Loading course details...</p>
    </div>

    <div v-else-if="error" class="alert alert-error shadow-lg max-w-lg mx-auto">
      <span>Course not found or currently unavailable.</span>
    </div>

    <div v-else-if="courseData" class="space-y-10">
      <!-- Course Hero Card -->
      <header class="card bg-base-200 border border-base-300 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div class="flex items-center gap-2 mb-3">
          <span class="badge badge-primary badge-sm font-semibold">Published Course</span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-extrabold text-base-content tracking-tight mb-4">
          {{ courseData.course.title }}
        </h1>

        <p class="text-base-content/80 text-lg leading-relaxed max-w-3xl mb-8">
          {{ courseData.course.description || 'Master key concepts with structured video modules and interactive exercises.' }}
        </p>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            v-if="!courseData.enrolled"
            @click="handleEnroll"
            :disabled="enrolling"
            class="btn btn-primary btn-lg gap-3 shadow-xl shadow-primary/25 rounded-2xl px-8 hover:scale-105 transition-all"
          >
            <GraduationCap class="w-5 h-5" />
            {{ enrolling ? 'Enrolling...' : 'Enroll in Course (Free)' }}
          </button>

          <button
            v-else
            @click="startLearning"
            class="btn btn-success btn-lg gap-3 shadow-xl shadow-success/25 rounded-2xl px-8 hover:scale-105 transition-all text-success-content"
          >
            <PlayCircle class="w-5 h-5" />
            Continue Learning
          </button>

          <NuxtLink
            :to="`/instructor/courses/${courseId}`"
            class="btn btn-warning btn-lg gap-2 shadow-xl shadow-warning/20 rounded-2xl px-6 hover:scale-105 transition-all text-[#0c0919] font-black"
          >
            <Video class="w-5 h-5" />
            Edit in Instructor Studio
          </NuxtLink>

          <p v-if="enrollError" class="text-error text-sm font-medium">{{ enrollError }}</p>
        </div>
      </header>

      <!-- Syllabus Section -->
      <section class="space-y-6">
        <div class="flex items-center gap-3">
          <BookOpen class="w-6 h-6 text-primary" />
          <h2 class="text-2xl font-bold text-base-content">Course Syllabus</h2>
        </div>

        <div v-if="!courseData.sections?.length" class="text-center py-10 bg-base-200/50 rounded-2xl border border-dashed border-base-300 text-base-content/60">
          No sections published yet for this course.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="section in courseData.sections"
            :key="section.id"
            class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl shadow-sm"
          >
            <input type="checkbox" checked />
            <div class="collapse-title text-lg font-bold text-base-content flex items-center gap-3">
              <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center font-extrabold">
                {{ section.position }}
              </span>
              {{ section.title }}
            </div>

            <div class="collapse-content border-t border-base-200 pt-3">
              <ul class="space-y-2">
                <li
                  v-for="lesson in section.lessons"
                  :key="lesson.id"
                  class="flex items-center justify-between p-3 rounded-xl hover:bg-base-200/70 transition-colors text-sm font-medium text-base-content/80"
                >
                  <div class="flex items-center gap-3">
                    <PlayCircle class="w-4 h-4 text-primary/70" />
                    <span>{{ lesson.position }}. {{ lesson.title }}</span>
                  </div>
                  <span class="text-xs text-base-content/40 font-mono">Video Lesson</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
