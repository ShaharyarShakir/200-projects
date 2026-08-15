<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAcademy } from '~/composables/useAcademy'
import { useApi } from '~/composables/useApi'
import VideoPlayer from '~/components/player/VideoPlayer.vue'
import { CheckCircle2, Circle, PlayCircle, Video, Loader2, BookOpen } from 'lucide-vue-next'

definePageMeta({
  layout: 'academy',
  middleware: ['academy']
})

const route = useRoute()
const courseId = route.params.courseId as string
const lessonId = ref(route.params.lessonId as string)

const { academy } = useAcademy()
const api = useApi()

const courseData = ref<any>(null)
const currentLesson = ref<any>(null)
const videoUrl = ref<string>('')
const isLoading = ref(true)
const isVideoLoading = ref(true)
const errorMsg = ref('')

async function loadCourseAndLessonData() {
  isLoading.value = true
  errorMsg.value = ''

  try {
    const data: any = await api.request(`/api/learn/courses/${courseId}`)
    courseData.value = data

    // Find current lesson info from sections outline
    let foundLesson: any = null
    if (data.sections) {
      for (const sec of data.sections) {
        if (sec.lessons) {
          const l = sec.lessons.find((item: any) => item.id === lessonId.value)
          if (l) {
            foundLesson = l
            break
          }
        }
      }
    }
    currentLesson.value = foundLesson || { id: lessonId.value, title: `Lesson` }

    await fetchVideoUrl()
  } catch (err: any) {
    console.error('Failed to load learn data:', err)
    errorMsg.value = err.message || 'Failed to load lesson'
  } finally {
    isLoading.value = false
  }
}

async function fetchVideoUrl() {
  isVideoLoading.value = true
  videoUrl.value = ''

  try {
    const res: any = await api.request(`/api/learn/courses/${courseId}/lessons/${lessonId.value}/video`)
    if (res && res.url) {
      videoUrl.value = res.url.startsWith('http')
        ? res.url
        : `${api.baseURL}${res.url}`
    }
  } catch (err: any) {
    console.warn('Could not fetch lesson video URL:', err)
  } finally {
    isVideoLoading.value = false
  }
}

onMounted(() => {
  loadCourseAndLessonData()
})

watch(() => route.params.lessonId, (newId) => {
  if (newId && newId !== lessonId.value) {
    lessonId.value = newId as string
    loadCourseAndLessonData()
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Breadcrumb -->
    <div class="flex items-center space-x-2 text-xs text-slate-400 font-medium">
      <NuxtLink to="/courses" class="hover:text-purple-400 transition-colors">Catalog</NuxtLink>
      <span>/</span>
      <NuxtLink :to="`/courses/${courseId}`" class="hover:text-purple-400 transition-colors truncate max-w-[200px]">
        {{ courseData?.course?.title || 'Course Overview' }}
      </NuxtLink>
      <span>/</span>
      <span class="text-slate-200 font-semibold truncate max-w-[200px]">
        {{ currentLesson?.title || 'Lesson' }}
      </span>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content & Video Player -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Video Container -->
        <div class="relative bg-[#0c0919] rounded-2xl border border-purple-900/40 overflow-hidden shadow-2xl">
          <div v-if="isVideoLoading" class="aspect-video flex flex-col items-center justify-center space-y-3 bg-slate-950/80">
            <Loader2 class="w-8 h-8 text-purple-400 animate-spin" />
            <p class="text-xs text-purple-300 font-medium">Loading video stream...</p>
          </div>

          <VideoPlayer
            v-else-if="videoUrl"
            :src="videoUrl"
            class="w-full aspect-video"
          />

          <div v-else class="aspect-video flex flex-col items-center justify-center p-8 text-center bg-slate-950/80 space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 shadow-inner">
              <Video class="w-6 h-6" />
            </div>
            <div>
              <p class="text-sm font-bold text-white">No Video Available</p>
              <p class="text-xs text-slate-400 mt-1 max-w-sm">
                This lesson does not have a processed video attached yet.
              </p>
            </div>
          </div>
        </div>

        <!-- Lesson Meta -->
        <div class="bg-[#0c0919]/60 border border-purple-900/30 rounded-2xl p-6 space-y-3">
          <h1 class="text-xl font-black text-white tracking-tight">
            {{ currentLesson?.title || 'Lesson Content' }}
          </h1>
          <p class="text-sm text-slate-400 leading-relaxed">
            Welcome to {{ currentLesson?.title || 'this lesson' }} on {{ academy?.name || 'AcademyOS' }}. Review the materials and complete the lesson video above.
          </p>
        </div>
      </div>

      <!-- Course Outline Sidebar -->
      <div class="space-y-4">
        <div class="bg-[#0c0919] border border-purple-900/40 rounded-2xl p-5 space-y-4 shadow-xl">
          <div class="flex items-center justify-between pb-3 border-b border-purple-900/30">
            <div class="flex items-center gap-2">
              <BookOpen class="w-4 h-4 text-purple-400" />
              <h3 class="text-sm font-bold text-white tracking-wide uppercase">Course Outline</h3>
            </div>
            <span v-if="courseData?.percent_complete !== undefined" class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {{ courseData.percent_complete }}% Done
            </span>
          </div>

          <div v-if="isLoading" class="py-8 flex items-center justify-center">
            <Loader2 class="w-5 h-5 text-purple-400 animate-spin" />
          </div>

          <div v-else-if="courseData?.sections" class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            <div v-for="sec in courseData.sections" :key="sec.id" class="space-y-2">
              <h4 class="text-xs font-bold text-purple-300/80 uppercase tracking-wider px-1">
                {{ sec.title }}
              </h4>

              <div class="space-y-1">
                <NuxtLink
                  v-for="les in sec.lessons"
                  :key="les.id"
                  :to="`/learn/${courseId}/${les.id}`"
                  class="flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all group"
                  :class="les.id === lessonId ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40' : 'text-slate-300 hover:bg-white/5 hover:text-white'"
                >
                  <div class="flex items-center gap-2.5 truncate">
                    <CheckCircle2 v-if="les.completed" class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <PlayCircle v-else-if="les.id === lessonId" class="w-3.5 h-3.5 text-purple-400 shrink-0 fill-purple-400/20" />
                    <Circle v-else class="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span class="truncate">{{ les.title }}</span>
                  </div>
                  <span v-if="les.video_status === 'ready'" class="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30 shrink-0">
                    HD
                  </span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
