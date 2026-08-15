<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { Plus, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  courseId: string
}>()

const api = useApi()
const title = ref('')
const loading = ref(false)

const emit = defineEmits<{
  created: []
}>()

async function createSection() {
  if (!title.value.trim()) {
    return
  }

  loading.value = true

  try {
    await api.request(
      `/api/courses/${props.courseId}/sections`,
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
    console.error('Failed to create section', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="createSection" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
    <input
      v-model="title"
      placeholder="New section title (e.g. Introduction to Architecture)"
      class="flex-1 bg-[#0c0919] border border-purple-900/60 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-slate-500 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium outline-none transition-all"
    />
    <button
      type="submit"
      :disabled="loading || !title.trim()"
      class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all uppercase tracking-wider shrink-0 cursor-pointer"
    >
      <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
      <Plus v-else class="w-4 h-4 stroke-[3]" />
      <span>Add Section</span>
    </button>
  </form>
</template>

