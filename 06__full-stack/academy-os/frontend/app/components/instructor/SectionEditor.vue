<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

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
    await $fetch(
      `${api.baseURL}/api/courses/${props.courseId}/sections`,
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
  <form @submit.prevent="createSection" class="section-editor">
    <input
      v-model="title"
      placeholder="Section title"
      class="editor-input"
    />
    <button type="submit" :disabled="loading" class="btn-primary">
      Add Section
    </button>
  </form>
</template>

<style scoped>
.section-editor {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.editor-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.btn-primary {
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
