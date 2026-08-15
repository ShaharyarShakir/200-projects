<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Sparkles, Plus, Loader2, AlertCircle } from 'lucide-vue-next'

const { createCourse: submitNewCourse } = useCourses()

const title = ref('')
const description = ref('')
const loading = ref(false)
const error = ref('')

async function createCourse() {
  if (!title.value.trim()) {
    error.value = 'Course title is required.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const course = await submitNewCourse({
      title: title.value,
      description: description.value
    })

    if (course?.id) {
      await navigateTo(`/instructor/courses/${course.id}`)
    }
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to create course.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 select-none">
    <!-- Back Link -->
    <NuxtLink
      to="/instructor/courses"
      class="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Back to Courses</span>
    </NuxtLink>

    <!-- Card Form -->
    <div class="relative overflow-hidden bg-[#130f26]/80 border border-purple-900/40 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
          <Sparkles class="w-3.5 h-3.5" />
          <span>New Curriculum</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
          Create New Course
        </h1>
        <p class="text-slate-400 text-xs sm:text-sm">Set up your new course details to get started with curriculum design.</p>
      </div>

      <form @submit.prevent="createCourse" class="space-y-5">
        <div class="space-y-2">
          <label for="title" class="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Course Title <span class="text-yellow-400">*</span>
          </label>
          <input
            id="title"
            v-model="title"
            type="text"
            placeholder="e.g. Master Go & Microservices Architecture"
            required
            class="w-full bg-[#0c0919] border border-purple-900/60 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-sm font-medium transition-all outline-none"
          />
        </div>

        <div class="space-y-2">
          <label for="description" class="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Course Description
          </label>
          <textarea
            id="description"
            v-model="description"
            rows="4"
            placeholder="Provide a comprehensive summary of what students will learn..."
            class="w-full bg-[#0c0919] border border-purple-900/60 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-sm font-medium transition-all outline-none resize-y"
          ></textarea>
        </div>

        <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider cursor-pointer mt-4"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <Plus v-else class="w-4 h-4 stroke-[3]" />
          <span>{{ loading ? 'Creating Course...' : 'Create Course & Continue' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>
