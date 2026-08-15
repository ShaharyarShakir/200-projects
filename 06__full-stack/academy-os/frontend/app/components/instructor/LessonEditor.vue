<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { Plus, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  courseId: string
  sectionId: string
}>()

const api = useApi()
const title = ref('')
const loading = ref(false)

const emit = defineEmits<{
  created: []
}>()

async function createLesson() {
  if (!title.value.trim()) {
    return
  }

  loading.value = true

  try {
    await api.request(
      `/api/courses/${props.courseId}/sections/${props.sectionId}/lessons`,
      {
        method: 'POST',
        body: {
          title: title.value
        }
      }
    )


    title.value = ''
    emit('created')
  } catch (err) {
    console.error('Failed to create lesson', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="createLesson" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
    <input
      v-model="title"
      placeholder="Add new lesson title..."
      class="flex-1 bg-[#0c0919] border border-purple-900/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition-all"
    />
    <button
      type="submit"
      :disabled="loading || !title.trim()"
      class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all uppercase tracking-wider shrink-0 cursor-pointer"
    >
      <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
      <Plus v-else class="w-3.5 h-3.5" />
      <span>Add Lesson</span>
    </button>
  </form>
</template>

