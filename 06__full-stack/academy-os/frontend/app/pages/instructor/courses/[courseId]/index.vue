<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useTenant } from '~/composables/useTenant'
import type { Course } from '~/types/course'
import SectionEditor from '~/components/instructor/SectionEditor.vue'
import LessonEditor from '~/components/instructor/LessonEditor.vue'
import VideoUploader from '~/components/instructor/VideoUploader.vue'
import { ArrowLeft, Sparkles, Send, Loader2, AlertCircle, Layers, FileText, CheckCircle2, Clock, RefreshCw } from 'lucide-vue-next'

const route = useRoute()
const api = useApi()
const { tenants, currentTenant, selectTenant, fetchTenants } = useTenant()
const courseId = route.params.courseId as string

const publishing = ref(false)
const publishError = ref('')

const { data: course, refresh, pending, error } = await useAsyncData<Course>(
  `course-structure-${courseId}`,
  () => api.request<Course>(`/api/courses/${courseId}/structure`)
)

onMounted(async () => {
  if (tenants.value.length === 0) {
    await fetchTenants()
  }
  if (!currentTenant.value && tenants.value.length > 0) {
    selectTenant(tenants.value[0])
    await refresh()
  }
})

async function publishCourse() {
  publishing.value = true
  publishError.value = ''

  try {
    await api.request(`/api/courses/${courseId}/publish`, {
      method: 'POST'
    })
    await refresh()
  } catch (err: any) {
    publishError.value = err.data?.message || err.message || 'Publishing failed. Please ensure all videos are ready.'
  } finally {
    publishing.value = false
  }
}

</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
    <!-- Back Link -->
    <NuxtLink
      to="/instructor/courses"
      class="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>All Courses</span>
    </NuxtLink>

    <!-- Loading State -->
    <div v-if="pending" class="flex flex-col items-center justify-center py-20 bg-[#130f26]/60 border border-purple-900/30 rounded-3xl backdrop-blur-md">
      <Loader2 class="w-10 h-10 text-yellow-400 animate-spin mb-4" />
      <p class="text-slate-300 text-sm font-medium">Loading course structure...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !course" class="bg-red-500/10 border border-red-500/30 rounded-3xl p-10 text-center space-y-4">
      <AlertCircle class="w-10 h-10 text-red-400 mx-auto" />
      <p class="text-white text-base font-bold">Could not load course structure.</p>
      <div class="flex items-center justify-center gap-4 pt-2">
        <button
          @click="refresh()"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs uppercase"
        >
          <RefreshCw class="w-3.5 h-3.5" /> Retry Loading
        </button>
        <NuxtLink to="/instructor/courses" class="inline-flex text-xs font-bold text-slate-300 hover:text-white">
          Back to courses
        </NuxtLink>
      </div>
    </div>

    <!-- Builder Content -->
    <div v-else class="space-y-8">
      <!-- Course Header Card -->
      <div class="bg-[#130f26]/80 border border-purple-900/40 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-2">
            <div class="flex items-center gap-3 flex-wrap">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                :class="course.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'"
              >
                <CheckCircle2 v-if="course.status === 'published'" class="w-3 h-3" />
                <Clock v-else class="w-3 h-3" />
                {{ course.status }}
              </span>
              <span class="text-xs text-slate-500 font-mono">ID: {{ course.id.substring(0, 8) }}</span>
            </div>

            <h1 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {{ course.title }}
            </h1>
          </div>

          <button
            @click="publishCourse"
            :disabled="publishing || course.status === 'published'"
            class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
            :class="course.status === 'published' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20 hover:scale-105'"
          >
            <Loader2 v-if="publishing" class="w-4 h-4 animate-spin" />
            <Send v-else class="w-4 h-4" />
            <span>{{ publishing ? 'Publishing...' : course.status === 'published' ? 'Published' : 'Publish Course' }}</span>
          </button>
        </div>

        <p class="text-slate-300 text-sm leading-relaxed border-t border-purple-900/30 pt-4">
          {{ course.description || 'No description provided.' }}
        </p>

        <!-- Publish Error Alert -->
        <div v-if="publishError" class="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ publishError }}</span>
        </div>
      </div>

      <!-- Sections & Curriculum Editor -->
      <main class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Layers class="w-5 h-5 text-yellow-400" />
            <span>Course Content</span>
          </h2>
          <span class="text-xs font-semibold text-slate-400">
            {{ course.sections?.length || 0 }} {{ course.sections?.length === 1 ? 'Section' : 'Sections' }}
          </span>
        </div>

        <!-- Empty Sections Banner -->
        <div v-if="!course.sections || !course.sections.length" class="bg-[#130f26]/60 border border-purple-900/30 p-8 rounded-3xl text-center space-y-3">
          <FileText class="w-8 h-8 text-slate-500 mx-auto" />
          <p class="text-slate-400 text-sm">No sections added yet. Start by adding a section below.</p>
        </div>

        <!-- Sections List -->
        <div v-else class="space-y-6">
          <section
            v-for="(section, sIdx) in course.sections"
            :key="section.id"
            class="bg-[#130f26]/90 border border-purple-900/40 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6"
          >
            <!-- Section Header -->
            <div class="flex items-center justify-between border-b border-purple-900/40 pb-4">
              <h3 class="text-lg font-black text-white flex items-center gap-3">
                <span class="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 text-yellow-400 text-xs flex items-center justify-center font-mono">
                  {{ sIdx + 1 }}
                </span>
                <span>{{ section.title }}</span>
              </h3>
            </div>

            <!-- Lessons List -->
            <div class="space-y-4">
              <div
                v-for="(lesson, lIdx) in section.lessons"
                :key="lesson.id"
                class="bg-[#0c0919]/90 border border-purple-900/30 rounded-2xl p-5 space-y-4"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <FileText class="w-4 h-4 text-purple-400" />
                    Lesson {{ lIdx + 1 }}: {{ lesson.title }}
                  </span>
                </div>

                <!-- Video Uploader Component -->
                <VideoUploader
                  :course-id="course.id"
                  :section-id="section.id"
                  :lesson-id="lesson.id"
                  :video-asset-id="lesson.video_asset_id"
                  :existing-video-asset="lesson.videoAsset"
                  @updated="refresh"
                />
              </div>

              <!-- Lesson Editor Component -->
              <LessonEditor
                :course-id="course.id"
                :section-id="section.id"
                @created="refresh"
              />
            </div>
          </section>
        </div>

        <!-- Add Section Component -->
        <SectionEditor
          :course-id="course.id"
          @created="refresh"
        />
      </main>
    </div>
  </div>
</template>

