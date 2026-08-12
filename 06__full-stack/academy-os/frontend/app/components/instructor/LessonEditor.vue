<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

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
    await $fetch(
      `${api.baseURL}/api/courses/${props.courseId}/sections/${props.sectionId}/lessons`,
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
  <form @submit.prevent="createLesson" class="lesson-editor">
    <input
      v-model="title"
      placeholder="Lesson title"
      class="editor-input"
    />
    <button type="submit" :disabled="loading" class="btn-secondary">
      Add Lesson
    </button>
  </form>
</template>

<style scoped>
.lesson-editor {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.editor-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.btn-secondary {
  padding: 0.4rem 0.8rem;
  background-color: #4b5563;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
