<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})

const title = ref('')
const description = ref('')
const isSubmitting = ref(false)
const errorMsg = ref('')

const { createCourse } = useCourses()

async function handleSubmit() {
  if (!title.value.trim()) return
  isSubmitting.value = true
  errorMsg.value = ''
  try {
    const course = await createCourse({
      title: title.value,
      description: description.value
    })
    if (course && course.id) {
      navigateTo(`/courses/${course.id}`)
    } else {
      navigateTo('/courses')
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to create course.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-tight">Create New Course</h1>
      <p class="text-slate-400 text-sm mt-1">Set up a new learning module for your students.</p>
    </div>

    <UiBaseCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Course Title</label>
          <input
            v-model="title"
            type="text"
            required
            placeholder="e.g. Master Go Web Architecture"
            class="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            v-model="description"
            rows="4"
            placeholder="Describe what students will learn in this course..."
            class="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
          ></textarea>
        </div>

        <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {{ errorMsg }}
        </div>

        <div class="flex items-center justify-end space-x-3">
          <NuxtLink to="/courses">
            <UiBaseButton variant="ghost">Cancel</UiBaseButton>
          </NuxtLink>
          <UiBaseButton type="submit" variant="primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creating...' : 'Create Course' }}
          </UiBaseButton>
        </div>
      </form>
    </UiBaseCard>
  </div>
</template>
